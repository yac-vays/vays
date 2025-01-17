import { CircularProgressbarWithChildren } from 'react-circular-progressbar';

const MessageLog = ({ loading }: { loading: boolean }) => {
  if (loading) {
    return (
      <CircularProgressbarWithChildren
        // id="message"
        value={100}
        className="xl:max-w-[38px] 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px] opacity-10"
        styles={{
          root: {
            // maxWidth: minW,
            // maxHeight: minW,
            imageRendering: 'crisp-edges',
            verticalAlign: 'middle',
          },
          path: {
            stroke: `rgba(200, 200, 200)`,
          },
          text: { fontSize: 28, textRendering: 'optimizeLegibility' },
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-30"
          height="60%"
          viewBox="0 -960 960 960"
          fill="grey"
        >
          <path d="M480-680q-33 0-56.5-23.5T400-760q0-33 23.5-56.5T480-840q33 0 56.5 23.5T560-760q0 33-23.5 56.5T480-680Zm-60 560v-480h120v480H420Z" />
        </svg>
        <div
          className="absolute h-14 w-14 animate-spin rounded-full border-4 border-solid border-darkgrey border-t-transparent opacity-10"
          style={{ zIndex: -10 }}
        ></div>
      </CircularProgressbarWithChildren>
    );
  }
  return (
    <CircularProgressbarWithChildren
      // id="message"
      value={100}
      className="xl:max-w-[38px] 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px]"
      styles={{
        root: {
          // maxWidth: minW,
          // maxHeight: minW,
          imageRendering: 'crisp-edges',
          verticalAlign: 'middle',
        },
        path: {
          stroke: `rgba(200, 200, 200)`,
        },
        text: { fontSize: 28, textRendering: 'optimizeLegibility' },
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-50"
        height="60%"
        viewBox="0 -960 960 960"
        fill="grey"
      >
        <path d="M480-680q-33 0-56.5-23.5T400-760q0-33 23.5-56.5T480-840q33 0 56.5 23.5T560-760q0 33-23.5 56.5T480-680Zm-60 560v-480h120v480H420Z" />
      </svg>
    </CircularProgressbarWithChildren>
  );
};

export default MessageLog;
