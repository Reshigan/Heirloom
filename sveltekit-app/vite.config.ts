import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 12000,
		cors: true,
		headers: {
			'X-Frame-Options': 'ALLOWALL'
		}
	},
	preview: {
		host: '0.0.0.0',
		port: 12000,
		cors: true
	},
	optimizeDeps: {
		include: ['three', 'lucide-svelte']
	}
});