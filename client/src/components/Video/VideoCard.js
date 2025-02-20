import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { FaMicrophoneSlash, FaVideoSlash } from "react-icons/fa";

const VideoCard = ({ peer, video, audio }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <VideoContainer>
      <Video playsInline autoPlay ref={ref} />
      <StatusIcons>
        {!video && (
          <Icon>
            <FaVideoSlash />
          </Icon>
        )}{" "}
        {/* Иконка камеры */}
        {!audio && (
          <Icon>
            <FaMicrophoneSlash />
          </Icon>
        )}{" "}
        {/* Иконка микрофона */}{" "}
      </StatusIcons>
    </VideoContainer>
  );
};

const VideoContainer = styled.div`
  position: relative;
  width: 755px;
    height: 350px;
    border-radius: 10px;
    object-fit: cover;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
`;

const StatusIcons = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 5px;
`;

const Icon = styled.span`
  font-size: 18px;
  color: red;
`;

export default VideoCard;
