import React, { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";
import styled from "styled-components";
import socket from "../../socket";
import VideoCard from "../Video/VideoCard";
import BottomBar from "../BottomBar/BottomBar";
import Chat from "../Chat/Chat";

const Room = (props) => {

  const generateRandomName = () => {
    return `User_${Math.floor(Math.random() * 10000)}`;
  };
  const currentUser = sessionStorage.getItem("user") || generateRandomName();
    sessionStorage.setItem("user", currentUser);
  const [peers, setPeers] = useState([]);
  const [userVideoAudio, setUserVideoAudio] = useState({
    localUser: { video: true, audio: true },
  });
  const [videoDevices, setVideoDevices] = useState([]);
  const [displayChat, setDisplayChat] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [showVideoDevices, setShowVideoDevices] = useState(false);
  const peersRef = useRef([]);
  const userVideoRef = useRef();
  const screenTrackRef = useRef();
  const userStream = useRef();
  const roomId = props.match.params.roomId;

  async function requestMediaPermissions() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Handle successful permission
      return stream;
    } catch (err) {
      // Handle permission denial
      console.error('Media permission denied:', err);
      alert('Please allow camera and microphone access to use the video chat');
      return null;
    }
  }

  useEffect(() => {
    const initializeMedia = async () => {
      const mediaStream = await requestMediaPermissions();
      if (!mediaStream) {
        // Handle case where permissions were denied
        history.push('/'); // Redirect to home or show error
        return;
      }
      // Continue with existing room join logic
      userVideoRef.current.srcObject = mediaStream;
      userStream.current = mediaStream;

      socket.emit("BE-join-room", { roomId, userName: currentUser });
      socket.on("FE-user-join", (users) => {
        const peers = [];
        users.forEach(({ userId, info }) => {
          let { userName, video, audio } = info;
          if (userName !== currentUser) {
            const peer = createPeer(userId, socket.id, mediaStream);

            peer.userName = userName;
            peer.peerID = userId;

            peersRef.current.push({
              peerID: userId,
              peer,
              userName,
            });
            peers.push(peer);

            setUserVideoAudio((preList) => {
              return {
                ...preList,
                [peer.userName]: { video, audio },
              };
            });
          }
        });

        setPeers(peers);
      });

      socket.on("FE-receive-call", ({ signal, from, info }) => {
        let { userName, video, audio } = info;
        const peerIdx = findPeer(from);

        if (!peerIdx) {
          const peer = addPeer(signal, from, mediaStream);

          peer.userName = userName;

          peersRef.current.push({
            peerID: from,
            peer,
            userName: userName,
          });
          setPeers((users) => {
            return [...users, peer];
          });
          setUserVideoAudio((preList) => {
            return {
              ...preList,
              [peer.userName]: { video, audio },
            };
          });
        }
      });

      socket.on("FE-call-accepted", ({ signal, answerId }) => {
        const peerIdx = findPeer(answerId);
        peerIdx.peer.signal(signal);
      });

      socket.on("FE-user-leave", ({ userId, userName }) => {
        const peerIdx = findPeer(userId);
        peerIdx.peer.destroy();
        setPeers((users) => {
          users = users.filter(
            (user) => user.peerID !== peerIdx.peer.peerID
          );
          return [...users];
        });
        peersRef.current = peersRef.current.filter(
          ({ peerID }) => peerID !== userId
        );
      });

      socket.on("FE-toggle-camera", ({ userId, switchTarget, video, audio }) => {
        const peerIdx = findPeer(userId);
        if (peerIdx) {
          setUserVideoAudio((preList) => {
            return {
              ...preList,
              [peerIdx.userName]: { video, audio },
            };
          });
        }
      });
    };
    
    initializeMedia();
  }, []);

  function createPeer(userId, caller, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("BE-call-user", {
        userToCall: userId,
        from: caller,
        signal,
      });
    });
    peer.on("disconnect", () => {
      peer.destroy();
    });

    return peer;
  }

  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("BE-accept-call", { signal, to: callerId });
    });

    peer.on("disconnect", () => {
      peer.destroy();
    });

    peer.signal(incomingSignal);

    return peer;
  }

  function findPeer(id) {
    return peersRef.current.find((p) => p.peerID === id);
  }

  function createUserVideo(peer, index, arr) {
    return (
      <VideoBox key={index} numPeers={arr.length + 1}>
        {writeUserName(peer.userName)}
        <VideoCard peer={peer} number={arr.length} />
      </VideoBox>
    );
  }

  function writeUserName(userName, index) {
    if (userVideoAudio.hasOwnProperty(userName)) {
      if (!userVideoAudio[userName].video) {
        return <UserName key={userName}>{userName}</UserName>;
      }
    }
  }

  // Open Chat
  const clickChat = (e) => {
    e.stopPropagation();
    setDisplayChat(!displayChat);
  };

  // BackButton
  const goToBack = (e) => {
    e.preventDefault();
    cleanupMediaStream();
    socket.emit("BE-leave-room", { roomId, leaver: currentUser });
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  const toggleCameraAudio = (e) => {
    const target = e.target.getAttribute("data-switch");

    setUserVideoAudio((preList) => {
      let videoSwitch = preList["localUser"].video;
      let audioSwitch = preList["localUser"].audio;

      try {
        if (target === "video") {
          const videoTracks = userVideoRef.current.srcObject.getVideoTracks();
          if (videoTracks.length > 0) {
            videoSwitch = !videoSwitch;
            videoTracks.forEach(track => {
              track.enabled = videoSwitch;
            });
          }
        } else {
          const audioTracks = userVideoRef.current.srcObject.getAudioTracks();
          if (audioTracks.length > 0) {
            audioSwitch = !audioSwitch;
            audioTracks.forEach(track => {
              track.enabled = audioSwitch;
            });
          }
        }

        // Emit the state change to other peers
        socket.emit("BE-toggle-camera-audio", { 
          roomId, 
          switchTarget: target,
          video: videoSwitch,
          audio: audioSwitch 
        });

        return {
          ...preList,
          localUser: { video: videoSwitch, audio: audioSwitch },
        };
      } catch (err) {
        console.error('Error toggling media:', err);
        // Keep previous state if error occurs
        return preList;
      }
    });
  };

  const clickScreenSharing = () => {
    if (!screenShare) {
      navigator.mediaDevices
        .getDisplayMedia({ cursor: true })
        .then((stream) => {
          const screenTrack = stream.getTracks()[0];

          peersRef.current.forEach(({ peer }) => {
            // replaceTrack (oldTrack, newTrack, oldStream);
            peer.replaceTrack(
              peer.streams[0]
                .getTracks()
                .find((track) => track.kind === "video"),
              screenTrack,
              userStream.current
            );
          });

          // Listen click end
          screenTrack.onended = () => {
            peersRef.current.forEach(({ peer }) => {
              peer.replaceTrack(
                screenTrack,
                peer.streams[0]
                  .getTracks()
                  .find((track) => track.kind === "video"),
                userStream.current
              );
            });
            userVideoRef.current.srcObject = userStream.current;
            setScreenShare(false);
          };

          userVideoRef.current.srcObject = stream;
          screenTrackRef.current = screenTrack;
          setScreenShare(true);
        });
    } else {
      screenTrackRef.current.onended();
    }
  };

  const expandScreen = (e) => {
    const elem = e.target;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Chrome, Safari & Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE/Edge */
      elem.msRequestFullscreen();
    }
  };

  const clickBackground = () => {
    if (!showVideoDevices) return;

    setShowVideoDevices(false);
  };

  const clickCameraDevice = (event) => {
    if (
      event &&
      event.target &&
      event.target.dataset &&
      event.target.dataset.value
    ) {
      const deviceId = event.target.dataset.value;
      const enabledAudio =
        userVideoRef.current.srcObject.getAudioTracks()[0].enabled;

      navigator.mediaDevices
        .getUserMedia({ video: { deviceId }, audio: enabledAudio })
        .then((stream) => {
          const newStreamTrack = stream
            .getTracks()
            .find((track) => track.kind === "video");
          const oldStreamTrack = userStream.current
            .getTracks()
            .find((track) => track.kind === "video");

          userStream.current.removeTrack(oldStreamTrack);
          userStream.current.addTrack(newStreamTrack);

          peersRef.current.forEach(({ peer }) => {
            // replaceTrack (oldTrack, newTrack, oldStream);
            peer.replaceTrack(
              oldStreamTrack,
              newStreamTrack,
              userStream.current
            );
          });
        });
    }
  };

  const copyURL = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  // Update the stream reconnection logic
  const reconnectStream = async (type) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video' ? true : false,
        audio: type === 'audio' ? true : false
      });

      const newTrack = type === 'video' 
        ? newStream.getVideoTracks()[0]
        : newStream.getAudioTracks()[0];

      if (userVideoRef.current && userVideoRef.current.srcObject) {
        const stream = userVideoRef.current.srcObject;
        const oldTrack = type === 'video'
          ? stream.getVideoTracks()[0]
          : stream.getAudioTracks()[0];

        if (oldTrack) {
          stream.removeTrack(oldTrack);
        }
        stream.addTrack(newTrack);

        // Update peers with new track
        peersRef.current.forEach(({ peer }) => {
          peer.replaceTrack(
            oldTrack,
            newTrack,
            stream
          );
        });
      }
    } catch (err) {
      console.error('Error reconnecting stream:', err);
    }
  };

  // Add cleanup for media streams when leaving room
  const cleanupMediaStream = () => {
    if (userVideoRef.current && userVideoRef.current.srcObject) {
      userVideoRef.current.srcObject.getTracks().forEach(track => {
        track.stop();
      });
      userVideoRef.current.srcObject = null;
    }
  };

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupMediaStream();
    };
  }, []);

  return (
    <RoomContainer onClick={clickBackground}>
      <MainVideoContainer displayChat={displayChat}>
        <VideoBox numPeers={peers.length + 1}>
          {userVideoAudio["localUser"].video ? null : (
            <>
              <UserName>{currentUser}</UserName>
            </>
          )}
          <MyVideo
            onClick={expandScreen}
            ref={userVideoRef}
            muted
            autoPlay
            playsInline
          ></MyVideo>
        </VideoBox>
        {peers &&
          peers.map((peer, index, arr) => (
            <VideoBox key={index} numPeers={arr.length + 1}>
              <VideoCard
                peer={peer}
                number={arr.length}
                video={userVideoAudio[peer.userName]?.video}
                audio={userVideoAudio[peer.userName]?.audio}
              />
              <UserName>{peer.userName}</UserName>
            </VideoBox>
          ))}
        {peers.length === 0 && (
          <SingleUserBlock>
            <CopyButton onClick={copyURL}>Copy URL</CopyButton>
          </SingleUserBlock>
        )}
      </MainVideoContainer>
      <BottomBar
        clickScreenSharing={clickScreenSharing}
        clickChat={clickChat}
        clickCameraDevice={clickCameraDevice}
        goToBack={goToBack}
        toggleCameraAudio={toggleCameraAudio}
        userVideoAudio={userVideoAudio["localUser"]}
        screenShare={screenShare}
        videoDevices={videoDevices}
        showVideoDevices={showVideoDevices}
        setShowVideoDevices={setShowVideoDevices}
      />
      <Chat display={displayChat} roomId={roomId} />
    </RoomContainer>
  );
};

const RoomContainer = styled.div`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const MainVideoContainer = styled.div`
  position: relative;
  flex: 1;
  display: grid;
  gap: 10px;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  width: ${({ displayChat }) => (displayChat ? "calc(100% - 300px)" : "100%")};
  transition: width 0.3s ease-in-out;
  grid-template-columns: repeat(auto-fit, minmax(755px, 1fr));
  grid-auto-rows: minmax(350px, auto);
  place-items: center;

  @media (max-width: 1920px) {
    grid-template-columns: repeat(auto-fit, minmax(755px, 1fr));
    grid-auto-rows: minmax(350px, auto);
  }

  @media (max-width: 1280px) {
    grid-template-columns: repeat(auto-fit, minmax(700px, 1fr));
    grid-auto-rows: minmax(169px, auto);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }
`;

const VideoBox = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  > video {
    width: ${({ numPeers }) => (numPeers <= 4 ? "755px" : "calc(100% / 3)")};
    height: ${({ numPeers }) => (numPeers <= 4 ? "350px" : "auto")};
    border-radius: 10px;
    object-fit: cover;
  }
`;

const SingleUserBlock = styled.div`
  position: relative;
  width: 755px;
  height: 350px;
  background-color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  z-index: 10;
  color: white;
`;

const CopyButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const UserName = styled.div`
  position: absolute;
  left: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 3px 5px;
  border-radius: 3px;
  z-index: 1;
  font-size: 14px;
  bottom: 10px;
`;

const MyVideo = styled.video``;

export default Room;
