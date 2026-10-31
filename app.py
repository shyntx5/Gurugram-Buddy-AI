from http.server import SimpleHTTPRequestHandler, HTTPServer
import json
import urllib.request
import webbrowser
import os

# Make sure Python always loads index.html and style.css from this exact folder
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class GurgaonAgentHandler(SimpleHTTPRequestHandler):

    # Allow HTML to connect even if opened via Live Server or double-click
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == "/ask-ai":
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            user_data = json.loads(post_data.decode("utf-8"))

            sector = user_data.get("sector", "Sector 55/56")
            budget = user_data.get("budget", "15000")
            commute = user_data.get("commute", "5")
            summary = user_data.get("summary", "")
            custom_q = user_data.get("question", "")

            # Student f-string prompt for Ollama
            prompt = (
                f"You are GuruGram Saver AI, a smart local survival assistant for students in Gurgaon. "
                f"The user lives in {sector} with a monthly budget of Rs {budget} and daily commute of {commute} km. "
                f"Here are the verified cheapest options calculated for them: {summary}. "
                f"User extra note: {custom_q}. "
                f"Give 3 short, practical bullet points on how they can save money and avoid broker/cab overcharging in {sector}. "
                f"Keep your response under 90 words."
            )

            ollama_payload = json.dumps({
                "model": "llama3.2",
                "prompt": prompt,
                "stream": False
            }).encode("utf-8")

            try:
                req = urllib.request.Request(
                    "http://localhost:11434/api/generate",
                    data=ollama_payload,
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=25) as response:
                    result = json.loads(response.read().decode("utf-8"))
                    ai_reply = result.get("response", "No response from model.")
                    model_status = "Live via Ollama (llama3.2 Local API)"
            except Exception:
                ai_reply = (
                    f"1. Housing Hack for {sector}: Book the recommended zero-brokerage PG directly and negotiate lock-in down to 1 month.\n"
                    f"2. Commute Strategy: For your {commute} km daily travel, stick to Rapido Bike Taxi during peak morning hours or use shared e-rickshaws to the nearest metro.\n"
                    f"3. Food & Daily Savings: Lock in the monthly home-style tiffin plan instead of ordering daily on food apps to save over Rs 2,500/month within your Rs {budget} budget."
                )
                model_status = "Local Agent Active (Fast Fallback Mode)"

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response_data = json.dumps({"reply": ai_reply, "status": model_status})
            self.wfile.write(response_data.encode("utf-8"))
        else:
            self.send_error(404)

if __name__ == "__main__":
    PORT = 8000
    url = f"http://localhost:{PORT}"
    print("====================================================")
    print(" GuruGram Saver AI Agent is LIVE!")
    print(f" Opening browser automatically at: {url}")
    print(" DO NOT press Ctrl+C in this terminal while using the app!")
    print("====================================================")
    
    # Automatically opens your browser so you don't have to copy the link
    webbrowser.open(url)
    
    server = HTTPServer(("localhost", PORT), GurgaonAgentHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped cleanly.")