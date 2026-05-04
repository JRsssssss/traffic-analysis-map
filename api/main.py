from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
import asyncio
from api.yoloModel import get_live_data

app = FastAPI()


@app.websocket("/ws/traffic-data")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        for live_data in get_live_data():

            await websocket.send_text(json.dumps(live_data))

            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        print("Client disconnected")
