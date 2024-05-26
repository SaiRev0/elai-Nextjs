"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import io from "socket.io-client";
let socket;
let peerConnection: RTCPeerConnection;

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

  const connectToSignalingServer = () => {
    socket = io("http://localhost:8080/");
    socket.on("connect", () => {
      console.log("Connected to signaling server");
      // Initialize peer connection after successful connection to the signaling server
      // initPeerConnection(socket);
    });
  };

  useEffect(() => {
    connectToSignalingServer();
  }, []);

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
      setText("Stream Started");
      console.log(result);
    } catch (e) {
      console.log(e);
    }
  };

  const submitCandidate = async () => {
    console.log("Ye hua");

    peerConnection = new RTCPeerConnection({
      iceServers: iceServers,
    });
    console.log("Ye hua 2");
    peerConnection.onicecandidate = async (event) => {
      if (!event.candidate) {
        console.log("Candidate is null");
        throw new Error("Candidate is null");
      }
      console.log(event.candidate);
      try {
        const res = await axios({
          method: "post",
          url: `https://apis.elai.io/api/v1/streams/candidate/${id}`,
          headers: {
            Authorization: `Bearer ${AUTH_KEY}`,
            "Content-Type": "application/json",
            accept: "application/json",
          },
          data: { candidate: event.candidate },
        });
        console.log(res);
      } catch (e) {
        console.log(e);
      }
    };
  };

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
      setText("Stream Deleted");
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
