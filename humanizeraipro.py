#!/usr/bin/env python3
"""
HumanizeAI Pro API Client
Recreates the requests to humanizeai.pro API endpoints
"""

import requests
import json
import time
import random
import string
from typing import Optional, Dict, Any, List
import sys

# =============================================================================
# CONFIGURATION - PUT YOUR TOKEN AND TEXT HERE
# =============================================================================
# JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNheWRpY3JlYXRpb25zQGdtYWlsLmNvbSIsImlhdCI6MTc1NzM1OTg4Nn0.abHhdb8sNJM3Bixhiw6LeBSl6mKmPZ8ID5BG0r19OXw"
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImhpbGx3ZWJ3b3Jrc0BnbWFpbC5jb20iLCJpYXQiOjE3NTgwMzgxNTh9.VIPpguWqAmQgDf3W1_WvWxRW1Grwf-p0aCK6prxMp7U"

TEXT_TO_HUMANIZE = """We know the inside of the Earth by studying seismic waves from earthquakes. These waves move differently through solid and liquid layers, helping scientists figure out what’s inside. We also study volcanoes, rocks, and magnetic fields to learn more about Earth’s layers.


"""

MODEL = "free1"  # or "standard1", etc.
ULTRA_MODE = False  # Set to True for ultra mode
# =============================================================================

class HumanizeAIPro:
    def __init__(self, jwt_token: str, session_id: Optional[str] = None):
        """
        Initialize the HumanizeAI Pro client
        
        Args:
            jwt_token: JWT token from the browser (Bearer token)
            session_id: Optional session ID, will generate one if not provided
        """
        self.jwt_token = jwt_token
        self.session_id = session_id or self._generate_session_id()
        self.base_url = "https://www.humanizeai.pro"
        self.session = requests.Session()
        
        # Set up headers that mimic the browser request
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {jwt_token}',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'max-age=0',
            'DNT': '1',
            'Origin': self.base_url,
            'Referer': f'{self.base_url}/',
            'Sec-Ch-Ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"macOS"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        })
    
    def _generate_session_id(self) -> str:
        """Generate a random session ID like the browser does"""
        return ''.join(random.choices(string.ascii_letters + string.digits, k=30))
    
    def get_user_info(self) -> Dict[str, Any]:
        """
        Get user information (credits, subscription status, etc.)
        
        Returns:
            Dict containing user info or raises exception on error
        """
        try:
            response = self.session.post(
                f"{self.base_url}/api/user/getuserinfo",
                data=''  # Empty body as shown in the capture
            )
            
            if not response.ok:
                raise Exception(f"getuserinfo failed: {response.status_code} - {response.text}")
            
            # Handle Brotli compression manually if needed
            if response.headers.get('content-encoding') == 'br':
                import brotli
                content = brotli.decompress(response.content)
                return json.loads(content.decode('utf-8'))
            else:
                return response.json()
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error getting user info: {e}")
        except ImportError:
            # If brotli is not available, try without it
            try:
                return response.json()
            except:
                raise Exception("Response is Brotli compressed but brotli library not available")
    
    def start_humanization_job(self, 
                             text: str, 
                             model: str = "free1",
                             is_logged: bool = True,
                             ultra: bool = False,
                             keywords: List[str] = None,
                             trial_number: int = 0,
                             alg: int = 0) -> str:
        """
        Start a humanization job
        
        Args:
            text: Text to humanize
            model: Model to use (free1, standard1, etc.)
            is_logged: Whether user is logged in
            ultra: Whether to use ultra mode
            keywords: Optional keywords
            trial_number: Trial number (usually 0)
            alg: Algorithm number (usually 0)
            
        Returns:
            completion_id for polling
        """
        if keywords is None:
            keywords = []
            
        payload = {
            "cacheMode": "start",
            "text": text,
            "trialNumber": trial_number,
            "alg": alg,
            "sessionId": self.session_id,
            "keywords": keywords,
            "model": model,
            "isLogged": is_logged,
            "ultra": ultra
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/process_free",
                json=payload
            )
            
            if not response.ok:
                error_data = response.json() if response.content else {}
                raise Exception(f"Start job failed: {response.status_code} - {error_data.get('error', response.text)}")
            
            data = response.json()
            
            if 'completionId' not in data:
                raise Exception(f"No completionId in response: {data}")
            
            return data['completionId']
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error starting job: {e}")
    
    def poll_for_result(self, 
                       completion_id: str,
                       keywords: List[str] = None,
                       interval_seconds: int = 2,
                       timeout_seconds: int = 300) -> str:
        """
        Poll for the humanization result
        
        Args:
            completion_id: ID from start_humanization_job
            keywords: Same keywords as used in start
            interval_seconds: How often to poll
            timeout_seconds: Maximum time to wait
            
        Returns:
            Final humanized text
        """
        if keywords is None:
            keywords = []
            
        payload = {
            "cacheMode": "get",
            "completionId": completion_id,
            "token": self.jwt_token,  # Client includes token in body during polling
            "sessionId": self.session_id,
            "keywords": keywords
        }
        
        start_time = time.time()
        
        while time.time() - start_time < timeout_seconds:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/process_free",
                    json=payload
                )
                
                if not response.ok:
                    error_data = response.json() if response.content else {}
                    raise Exception(f"Poll failed: {response.status_code} - {error_data.get('error', response.text)}")
                
                data = response.json()
                
                # Check for errors
                if 'error' in data:
                    error_msg = data['error']
                    if 'message' in data:
                        error_msg += f" - {data['message']}"
                    raise Exception(f"Server error: {error_msg}")
                
                # Check for result
                if 'result' in data:
                    result = data['result']
                    
                    # Result should be an array of versions
                    if isinstance(result, list) and len(result) > 0:
                        # Get the last (final) version
                        final_version = result[-1]
                        if isinstance(final_version, dict) and 'text' in final_version:
                            return final_version['text']
                        else:
                            raise Exception(f"Unexpected result format: {result}")
                    else:
                        raise Exception(f"Empty or invalid result: {result}")
                
                # No result yet, keep polling
                time.sleep(interval_seconds)
                
            except requests.exceptions.RequestException as e:
                raise Exception(f"Network error during polling: {e}")
        
        raise Exception(f"Timeout after {timeout_seconds} seconds")
    
    def humanize_text(self, 
                     text: str,
                     model: str = "free1",
                     ultra: bool = False,
                     keywords: List[str] = None,
                     check_user_info: bool = True) -> str:
        """
        Complete humanization flow: start job and poll for result
        
        Args:
            text: Text to humanize
            model: Model to use
            ultra: Whether to use ultra mode
            keywords: Optional keywords
            check_user_info: Whether to check user info first
            
        Returns:
            Humanized text
        """
        print(f"Starting humanization with model: {model}, ultra: {ultra}")
        
        # Optional: Check user info first
        if check_user_info:
            try:
                user_info = self.get_user_info()
                print(f"User info: {user_info}")
            except Exception as e:
                print(f"Warning: Could not get user info: {e}")
        
        # Start the job
        completion_id = self.start_humanization_job(
            text=text,
            model=model,
            ultra=ultra,
            keywords=keywords
        )
        
        print(f"Job started with completion ID: {completion_id}")
        
        # Poll for result
        result = self.poll_for_result(completion_id, keywords)
        
        print("Humanization completed!")
        return result


def main():
    """Main function - uses the configuration at the top of the file"""
    print("="*60)
    print("HUMANIZE AI PRO - AUTOMATED CLIENT")
    print("="*60)
    print(f"Token: {JWT_TOKEN[:50]}...")
    print(f"Text: {TEXT_TO_HUMANIZE}")
    print(f"Model: {MODEL}")
    print(f"Ultra Mode: {ULTRA_MODE}")
    print("="*60)
    
    try:
        client = HumanizeAIPro(JWT_TOKEN)
        result = client.humanize_text(
            text=TEXT_TO_HUMANIZE, 
            model=MODEL, 
            ultra=ULTRA_MODE
        )
        
        print("\n" + "="*60)
        print("RESULTS")
        print("="*60)
        print("ORIGINAL TEXT:")
        print("-" * 40)
        print(TEXT_TO_HUMANIZE)
        print("\nHUMANIZED TEXT:")
        print("-" * 40)
        print(result)
        print("="*60)
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
