"""
Sentiment analysis using local Ollama LLM.
Analyzes memory text and returns sentiment score and label.
"""
import os
import requests
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
USE_LOCAL_OLLAMA = os.getenv("USE_LOCAL_OLLAMA", "true").lower() == "true"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")

def analyze_sentiment(text: str) -> Dict[str, Optional[any]]:
    """
    Analyze sentiment of text using Ollama.
    Returns dict with sentiment_score (-1 to 1) and sentiment_label.
    
    Labels use positive, emotionally-aware language:
    - joyful (0.6 to 1.0)
    - hopeful (0.2 to 0.6)
    - reflective (-0.2 to 0.2)
    - bittersweet (-0.6 to -0.2)
    - poignant (-1.0 to -0.6)
    """
    if not USE_LOCAL_OLLAMA:
        logger.info("Ollama disabled, returning neutral sentiment")
        return {
            "sentiment_score": 0.0,
            "sentiment_label": "reflective"
        }
    
    try:
        prompt = f"""Analyze the emotional sentiment of this memory text. Respond with ONLY a number between -1 and 1, where:
-1 = very sad/negative
0 = neutral
1 = very happy/positive

Text: {text[:500]}

Sentiment score:"""
        
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 10
                }
            },
            timeout=10
        )
        
        if response.status_code != 200:
            logger.error(f"Ollama API error: {response.status_code}")
            return {"sentiment_score": 0.0, "sentiment_label": "reflective"}
        
        result = response.json()
        response_text = result.get("response", "0").strip()
        
        try:
            score = float(response_text.split()[0])
            score = max(-1.0, min(1.0, score))
        except (ValueError, IndexError):
            logger.warning(f"Could not parse sentiment score: {response_text}")
            score = 0.0
        
        if score >= 0.6:
            label = "joyful"
        elif score >= 0.2:
            label = "hopeful"
        elif score >= -0.2:
            label = "reflective"
        elif score >= -0.6:
            label = "bittersweet"
        else:
            label = "poignant"
        
        logger.info(f"Sentiment analysis: score={score:.2f}, label={label}")
        return {
            "sentiment_score": score,
            "sentiment_label": label
        }
        
    except requests.exceptions.Timeout:
        logger.error("Ollama request timeout")
        return {"sentiment_score": 0.0, "sentiment_label": "reflective"}
    except requests.exceptions.ConnectionError:
        logger.error("Could not connect to Ollama")
        return {"sentiment_score": 0.0, "sentiment_label": "reflective"}
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        return {"sentiment_score": 0.0, "sentiment_label": "reflective"}

def analyze_sentiment_batch(texts: list[str]) -> list[Dict[str, Optional[any]]]:
    """Analyze sentiment for multiple texts"""
    return [analyze_sentiment(text) for text in texts]
