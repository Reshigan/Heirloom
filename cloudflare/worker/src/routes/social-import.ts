/**
 * Social Media Import Routes
 * Import photos and memories from Facebook, Instagram, and Google Photos
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';

export const socialImportRoutes = new Hono<AppEnv>();

// ============================================
// OAUTH CONFIGURATION
// ============================================

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

// Get OAuth config from environment
const getOAuthConfig = (env: any, provider: string): OAuthConfig | null => {
  switch (provider) {
    case 'facebook':
      return env.FACEBOOK_CLIENT_ID ? {
        clientId: env.FACEBOOK_CLIENT_ID,
        clientSecret: env.FACEBOOK_CLIENT_SECRET,
        redirectUri: `${env.API_URL}/api/import/facebook/callback`,
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        scopes: ['user_photos', 'user_posts'],
      } : null;
    case 'instagram':
      return env.INSTAGRAM_CLIENT_ID ? {
        clientId: env.INSTAGRAM_CLIENT_ID,
        clientSecret: env.INSTAGRAM_CLIENT_SECRET,
        redirectUri: `${env.API_URL}/api/import/instagram/callback`,
        authUrl: 'https://api.instagram.com/oauth/authorize',
        tokenUrl: 'https://api.instagram.com/oauth/access_token',
        scopes: ['user_profile', 'user_media'],
      } : null;
    case 'google':
      return env.GOOGLE_CLIENT_ID ? {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        redirectUri: `${env.API_URL}/api/import/google/callback`,
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/photoslibrary.readonly'],
      } : null;
    default:
      return null;
  }
};

// ============================================
// GET AVAILABLE PROVIDERS
// ============================================

socialImportRoutes.get('/providers', async (c) => {
  const providers = [];
  
  if (c.env.FACEBOOK_CLIENT_ID) {
    providers.push({
      id: 'facebook',
      name: 'Facebook',
      icon: 'facebook',
      description: 'Import photos and posts from your Facebook account',
      connected: false,
    });
  }
  
  if (c.env.INSTAGRAM_CLIENT_ID) {
    providers.push({
      id: 'instagram',
      name: 'Instagram',
      icon: 'instagram',
      description: 'Import photos from your Instagram account',
      connected: false,
    });
  }
  
  if (c.env.GOOGLE_CLIENT_ID) {
    providers.push({
      id: 'google',
      name: 'Google Photos',
      icon: 'google',
      description: 'Import photos from your Google Photos library',
      connected: false,
    });
  }
  
  // Check which providers the user has connected
  const userId = c.get('userId');
  const connections = await c.env.DB.prepare(`
    SELECT provider FROM social_connections WHERE user_id = ? AND status = 'ACTIVE'
  `).bind(userId).all();
  
  const connectedProviders = new Set(connections.results.map((r: any) => r.provider));
  
  return c.json({
    providers: providers.map(p => ({
      ...p,
      connected: connectedProviders.has(p.id),
    })),
  });
});

// ============================================
// INITIATE OAUTH FLOW
// ============================================

socialImportRoutes.get('/connect/:provider', async (c) => {
  const userId = c.get('userId');
  const provider = c.req.param('provider');
  
  const config = getOAuthConfig(c.env, provider);
  if (!config) {
    return c.json({ error: `Provider ${provider} is not configured` }, 400);
  }
  
  // Generate state token for CSRF protection
  const state = crypto.randomUUID();
  const now = new Date().toISOString();
  
  // Store state in database
  await c.env.DB.prepare(`
    INSERT INTO oauth_states (id, user_id, provider, state, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    userId,
    provider,
    state,
    now,
    new Date(Date.now() + 10 * 60 * 1000).toISOString()
  ).run();
  
  // Build authorization URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });
  
  if (provider === 'google') {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }
  
  const authUrl = `${config.authUrl}?${params.toString()}`;
  
  return c.json({ authUrl });
});

// ============================================
// OAUTH CALLBACKS
// ============================================

socialImportRoutes.get('/facebook/callback', async (c) => {
  return handleOAuthCallback(c, 'facebook');
});

socialImportRoutes.get('/instagram/callback', async (c) => {
  return handleOAuthCallback(c, 'instagram');
});

socialImportRoutes.get('/google/callback', async (c) => {
  return handleOAuthCallback(c, 'google');
});

async function handleOAuthCallback(c: any, provider: string) {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');
  
  if (error) {
    return c.redirect(`${c.env.APP_URL}/settings?import_error=${encodeURIComponent(error)}`);
  }
  
  if (!code || !state) {
    return c.redirect(`${c.env.APP_URL}/settings?import_error=missing_params`);
  }
  
  // Verify state
  const stateRecord = await c.env.DB.prepare(`
    SELECT * FROM oauth_states 
    WHERE state = ? AND provider = ? AND expires_at > ?
  `).bind(state, provider, new Date().toISOString()).first();
  
  if (!stateRecord) {
    return c.redirect(`${c.env.APP_URL}/settings?import_error=invalid_state`);
  }
  
  const userId = stateRecord.user_id;
  
  // Delete used state
  await c.env.DB.prepare(`DELETE FROM oauth_states WHERE id = ?`).bind(stateRecord.id).run();
  
  // Exchange code for tokens
  const config = getOAuthConfig(c.env, provider);
  if (!config) {
    return c.redirect(`${c.env.APP_URL}/settings?import_error=provider_not_configured`);
  }
  
  try {
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokens = await tokenResponse.json() as any;
    
    if (tokens.error) {
      return c.redirect(`${c.env.APP_URL}/settings?import_error=${encodeURIComponent(tokens.error)}`);
    }
    
    const now = new Date().toISOString();
    const expiresAt = tokens.expires_in 
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;
    
    // Store connection
    await c.env.DB.prepare(`
      INSERT INTO social_connections (id, user_id, provider, access_token, refresh_token, expires_at, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
      ON CONFLICT(user_id, provider) DO UPDATE SET
        access_token = excluded.access_token,
        refresh_token = COALESCE(excluded.refresh_token, social_connections.refresh_token),
        expires_at = excluded.expires_at,
        status = 'ACTIVE',
        updated_at = excluded.updated_at
    `).bind(
      crypto.randomUUID(),
      userId,
      provider,
      tokens.access_token,
      tokens.refresh_token || null,
      expiresAt,
      now,
      now
    ).run();
    
    return c.redirect(`${c.env.APP_URL}/settings?import_success=${provider}`);
  } catch (err: any) {
    console.error(`OAuth callback error for ${provider}:`, err);
    return c.redirect(`${c.env.APP_URL}/settings?import_error=token_exchange_failed`);
  }
}

// ============================================
// DISCONNECT PROVIDER
// ============================================

socialImportRoutes.delete('/disconnect/:provider', async (c) => {
  const userId = c.get('userId');
  const provider = c.req.param('provider');
  
  await c.env.DB.prepare(`
    UPDATE social_connections SET status = 'DISCONNECTED', updated_at = ?
    WHERE user_id = ? AND provider = ?
  `).bind(new Date().toISOString(), userId, provider).run();
  
  return c.json({ success: true });
});

// ============================================
// LIST IMPORTABLE MEDIA
// ============================================

socialImportRoutes.get('/media/:provider', async (c) => {
  const userId = c.get('userId');
  const provider = c.req.param('provider');
  const cursor = c.req.query('cursor');
  
  // Get connection
  const connection = await c.env.DB.prepare(`
    SELECT * FROM social_connections 
    WHERE user_id = ? AND provider = ? AND status = 'ACTIVE'
  `).bind(userId, provider).first();
  
  if (!connection) {
    return c.json({ error: 'Provider not connected' }, 400);
  }
  
  try {
    let media: any[] = [];
    let nextCursor: string | null = null;
    
    switch (provider) {
      case 'facebook':
        const fbResult = await fetchFacebookPhotos(connection.access_token as string, cursor);
        media = fbResult.media;
        nextCursor = fbResult.nextCursor;
        break;
      case 'instagram':
        const igResult = await fetchInstagramMedia(connection.access_token as string, cursor);
        media = igResult.media;
        nextCursor = igResult.nextCursor;
        break;
      case 'google':
        const gpResult = await fetchGooglePhotos(connection.access_token as string, cursor);
        media = gpResult.media;
        nextCursor = gpResult.nextCursor;
        break;
    }
    
    return c.json({ media, nextCursor });
  } catch (err: any) {
    console.error(`Error fetching media from ${provider}:`, err);
    return c.json({ error: 'Failed to fetch media', details: err.message }, 500);
  }
});

// ============================================
// IMPORT SELECTED MEDIA
// ============================================

socialImportRoutes.post('/import', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { provider, mediaIds } = body;
  
  if (!provider || !mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
    return c.json({ error: 'Provider and mediaIds are required' }, 400);
  }
  
  if (mediaIds.length > 50) {
    return c.json({ error: 'Maximum 50 items can be imported at once' }, 400);
  }
  
  // Get connection
  const connection = await c.env.DB.prepare(`
    SELECT * FROM social_connections 
    WHERE user_id = ? AND provider = ? AND status = 'ACTIVE'
  `).bind(userId, provider).first();
  
  if (!connection) {
    return c.json({ error: 'Provider not connected' }, 400);
  }
  
  const now = new Date().toISOString();
  const imported: string[] = [];
  const failed: string[] = [];
  
  for (const mediaId of mediaIds) {
    try {
      let mediaUrl: string | null = null;
      let mediaType = 'PHOTO';
      let caption = '';
      
      switch (provider) {
        case 'facebook':
          const fbMedia = await fetchFacebookMediaById(connection.access_token as string, mediaId);
          mediaUrl = fbMedia.url;
          caption = fbMedia.caption || '';
          break;
        case 'instagram':
          const igMedia = await fetchInstagramMediaById(connection.access_token as string, mediaId);
          mediaUrl = igMedia.url;
          mediaType = igMedia.type === 'VIDEO' ? 'VIDEO' : 'PHOTO';
          caption = igMedia.caption || '';
          break;
        case 'google':
          const gpMedia = await fetchGooglePhotoById(connection.access_token as string, mediaId);
          mediaUrl = gpMedia.url;
          mediaType = gpMedia.type === 'video' ? 'VIDEO' : 'PHOTO';
          caption = gpMedia.description || '';
          break;
      }
      
      if (!mediaUrl) {
        failed.push(mediaId);
        continue;
      }
      
      // Download the media
      const mediaResponse = await fetch(mediaUrl);
      const mediaBuffer = await mediaResponse.arrayBuffer();
      const contentType = mediaResponse.headers.get('content-type') || 'image/jpeg';
      
      // Upload to R2
      const fileKey = `memories/${userId}/${Date.now()}-${mediaId}.${contentType.split('/')[1] || 'jpg'}`;
      await c.env.STORAGE.put(fileKey, mediaBuffer, {
        httpMetadata: { contentType },
      });
      
      const fileUrl = `${c.env.API_URL}/api/memories/file/${encodeURIComponent(fileKey)}`;
      
      // Create memory record
      const memoryId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO memories (id, user_id, type, title, description, file_url, file_key, file_size, mime_type, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        memoryId,
        userId,
        mediaType,
        caption.substring(0, 100) || `Imported from ${provider}`,
        caption,
        fileUrl,
        fileKey,
        mediaBuffer.byteLength,
        contentType,
        JSON.stringify({ importedFrom: provider, originalId: mediaId }),
        now,
        now
      ).run();
      
      imported.push(memoryId);
    } catch (err: any) {
      console.error(`Failed to import media ${mediaId}:`, err);
      failed.push(mediaId);
    }
  }
  
  return c.json({
    success: true,
    imported: imported.length,
    failed: failed.length,
    importedIds: imported,
    failedIds: failed,
  });
});

// ============================================
// HELPER FUNCTIONS FOR EACH PROVIDER
// ============================================

async function fetchFacebookPhotos(accessToken: string, cursor?: string | null) {
  const url = new URL('https://graph.facebook.com/v18.0/me/photos');
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('fields', 'id,name,picture,source,created_time');
  url.searchParams.set('limit', '25');
  if (cursor) url.searchParams.set('after', cursor);
  
  const response = await fetch(url.toString());
  const data = await response.json() as any;
  
  return {
    media: (data.data || []).map((item: any) => ({
      id: item.id,
      thumbnail: item.picture,
      url: item.source,
      caption: item.name,
      createdAt: item.created_time,
      type: 'photo',
    })),
    nextCursor: data.paging?.cursors?.after || null,
  };
}

async function fetchFacebookMediaById(accessToken: string, mediaId: string) {
  const url = `https://graph.facebook.com/v18.0/${mediaId}?access_token=${accessToken}&fields=source,name`;
  const response = await fetch(url);
  const data = await response.json() as any;
  return { url: data.source, caption: data.name };
}

async function fetchInstagramMedia(accessToken: string, cursor?: string | null) {
  const url = new URL('https://graph.instagram.com/me/media');
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('fields', 'id,caption,media_type,media_url,thumbnail_url,timestamp');
  url.searchParams.set('limit', '25');
  if (cursor) url.searchParams.set('after', cursor);
  
  const response = await fetch(url.toString());
  const data = await response.json() as any;
  
  return {
    media: (data.data || []).map((item: any) => ({
      id: item.id,
      thumbnail: item.thumbnail_url || item.media_url,
      url: item.media_url,
      caption: item.caption,
      createdAt: item.timestamp,
      type: item.media_type?.toLowerCase() || 'image',
    })),
    nextCursor: data.paging?.cursors?.after || null,
  };
}

async function fetchInstagramMediaById(accessToken: string, mediaId: string) {
  const url = `https://graph.instagram.com/${mediaId}?access_token=${accessToken}&fields=media_url,media_type,caption`;
  const response = await fetch(url);
  const data = await response.json() as any;
  return { url: data.media_url, type: data.media_type, caption: data.caption };
}

async function fetchGooglePhotos(accessToken: string, cursor?: string | null) {
  const url = 'https://photoslibrary.googleapis.com/v1/mediaItems';
  const params: any = { pageSize: 25 };
  if (cursor) params.pageToken = cursor;
  
  const response = await fetch(`${url}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json() as any;
  
  return {
    media: (data.mediaItems || []).map((item: any) => ({
      id: item.id,
      thumbnail: `${item.baseUrl}=w200-h200`,
      url: `${item.baseUrl}=d`,
      caption: item.description,
      createdAt: item.mediaMetadata?.creationTime,
      type: item.mediaMetadata?.video ? 'video' : 'photo',
    })),
    nextCursor: data.nextPageToken || null,
  };
}

async function fetchGooglePhotoById(accessToken: string, mediaId: string) {
  const url = `https://photoslibrary.googleapis.com/v1/mediaItems/${mediaId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json() as any;
  return {
    url: `${data.baseUrl}=d`,
    type: data.mediaMetadata?.video ? 'video' : 'photo',
    description: data.description,
  };
}

export default socialImportRoutes;
