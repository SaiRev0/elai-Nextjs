"use client";

import axios from "axios";
import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [id, setId] = useState("");
  const [offer, setOffer] = useState();
  const [iceServers, setIceServers] = useState();

  // Constants
  const AUTH_KEY = "MXj3E42DsfH8d8nkF3bmavTeLLra1RmB";
  const avatarCode = "gia";
  const voiceId = "LcfcDJNUP1GQjkzn1xUU";
  const voiceProvider = "elevenlabs";

  const createStream = async () => {
    setText("Creating Stream...");
    try {
      const response = await axios({
        method: "post",
        url: "https://apis.elai.io/api/v1/streams",
        headers: {
          Authorization: `Bearer ${AUTH_KEY}`,
          "Content-Type": "application/json",
        },
        data: {
          avatarCode: avatarCode,
          voiceId: voiceId,
          voiceProvider: voiceProvider,
        },
      });
      if (response.data.id) {
        setText(response.data.id);
        console.log(response.data.id);
        const { id, webrtcData } = response.data;
        const { offer, iceServers } = webrtcData;
        setId(id);
        setOffer(offer);
        setIceServers(iceServers);
      }
    } catch (e: any) {
      if (e.response.data.message) {
        setText(e.response.data.message);
      }
      console.log(e);
    }
  };

  const startStream = async () => {
    setText("Starting Stream...");
    try {
      const peerConnection = new RTCPeerConnection({
        iceTransportPolicy: "relay",
        iceServers,
      });
      if (!offer) {
        throw new Error("Offer is undefined");
      }
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      const result = await axios({
        method: "put",
        url: `https://apis.elai.io/api/v1/streams/${id}`,
        headers: {
          Authorization: `Bearer ${AUTH_KEY}`,
          "Content-Type": "application/json",
        },
        data: JSON.stringify({ answer }),
      });

      console.log(result);
    } catch (e) {
      console.log(e);
    }
  };

  const submitCandidate = async () => {};

  const deleteStream = async () => {
    setText("Deleting Stream...");
    try {
      await axios({
        method: "delete",
        url: `https://apis.elai.io/api/v1/streams/${id}`,
        headers: {
          Authorization: `Bearer ${AUTH_KEY}`,
        },
      });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        Response :
        <br />
        {text}
      </div>
      <button className="bg-blue-600 p-2 rounded-full" onClick={createStream}>
        Create Stream
      </button>
      <button className="bg-green-600 p-2 rounded-full" onClick={startStream}>
        Start Stream
      </button>
      <button
        className="bg-yellow-600 p-2 rounded-full"
        onClick={submitCandidate}
      >
        Submit webRTC Candidate
      </button>
      <button className="bg-red-600 p-2 rounded-full" onClick={deleteStream}>
        Delete Stream
      </button>
    </main>
  );
}
