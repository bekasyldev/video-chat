import React, { useCallback } from 'react';
import styled from 'styled-components';
import { FaDesktop } from 'react-icons/fa';
import { FaPhone } from 'react-icons/fa';
import { FaComment } from 'react-icons/fa';

const BottomBar = ({
  clickChat,
  clickCameraDevice,
  goToBack,
  toggleCameraAudio,
  userVideoAudio,
  clickScreenSharing,
  screenShare,
  videoDevices,
  showVideoDevices,
  setShowVideoDevices
}) => {
  const handleToggle = useCallback(
    (e) => {
      setShowVideoDevices((state) => !state);
    },
    [setShowVideoDevices]
  );

  return (
    <Bar>
      <Left>
        <CameraButton onClick={toggleCameraAudio} data-switch='audio'>
          <div>
            {userVideoAudio.audio ? (
              <FaIcon className='fas fa-microphone'></FaIcon>
            ) : (
              <FaIcon className='fas fa-microphone-slash'></FaIcon>
            )}
          </div>
        </CameraButton>
        <CameraButton onClick={toggleCameraAudio} data-switch='video'>
          <div>
            {userVideoAudio.video ? (
              <FaIcon className='fas fa-video'></FaIcon>
            ) : (
              <FaIcon className='fas fa-video-slash'></FaIcon>
            )}
          </div>
        </CameraButton>
      </Left>
      <Center>
      <ChatButton onClick={clickChat}>
        <FaComment></FaComment>
        </ChatButton>
        <ScreenButton onClick={clickScreenSharing}>
          <FaDesktop className={screenShare ? 'sharing' : ''} />
        </ScreenButton>
      </Center>
      <Right>
        <StopButton onClick={goToBack}>
        <FaPhone></FaPhone>
        </StopButton>
      </Right>
    </Bar>
  );
};

const Bar = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 8%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  z-index: 1;
`;
const Left = styled.div`
  display: flex;
  align-items: center;

  margin-left: 15px;
  gap: 10px;
`;

const Center = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 10px;
`;

const Right = styled.div``;



const ChatButton = styled.div`
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  text-align: center;
  height: 40px;
  font-size: calc(16px + 1vmin);
  background: #0094ff;

  :hover {
    opacity: .7;
    cursor: pointer;
  }

  * {
    pointer-events: none;
  }
`;

const ScreenButton = styled.div`
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  text-align: center;
  height: 40px;
  font-size: calc(16px + 1vmin);
  background: #0094ff;

  :hover {
    opacity: .7;
    cursor: pointer;
  }

  .sharing {
    color: #ee2560;
  }
`;

const FaIcon = styled.i`
  width: 30px;
  font-size: calc(10px + 1vmin);
`;

const StopButton = styled.div`
margin-right: 15px;
width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  text-align: center;
  height: 40px;
  font-size: calc(13px + 1vmin);
  background-color: #ee2560;

  :hover {
    opacity: .7;
    cursor: pointer;
  }
`;

const CameraButton = styled.div`

  width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    text-align: center;
    height: 40px;
    font-size: calc(16px + 1vmin);
    background: #0094ff;

  :hover {
    opacity: .7;
    cursor: pointer;
  }

  * {
    pointer-events: none;
    display: flex;
    pointer-events: none;
    /* align-self: center; */
    align-items: center;
    justify-content: center;
  }

  .fa-microphone-slash {
    color: #ee2560;
    width: 45px;
  }

  .fa-video-slash {
    color: #ee2560;
    width: 45px;
  }
`;

const SwitchMenu = styled.div`
  display: flex;
  position: absolute;
  width: 20px;
  top: 7px;
  left: 80px;
  z-index: 1;

  :hover {
    background-color: #476d84;
    cursor: pointer;
    border-radius: 15px;
  }

  * {
    pointer-events: none;
  }

  > i {
    width: 90%;
    font-size: calc(10px + 1vmin);
  }
`;

const SwitchList = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: -65.95px;
  left: 80px;
  background-color: #4ea1d3;
  color: white;
  padding-top: 5px;
  padding-right: 10px;
  padding-bottom: 5px;
  padding-left: 10px;
  text-align: left;

  > div {
    font-size: 0.85rem;
    padding: 1px;
    margin-bottom: 5px;

    :not(:last-child):hover {
      background-color: #77b7dd;
      cursor: pointer;
    }
  }

  > div:last-child {
    border-top: 1px solid white;
    cursor: context-menu !important;
  }
`;

export default BottomBar;

