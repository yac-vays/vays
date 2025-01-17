import { CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { Nullable } from '../../../../utils/typeUtils';

const NumberLog = ({
  progress,
  problem,
  loading,
}: {
  progress: Nullable<number>;
  problem: Nullable<boolean>;
  loading: boolean;
}) => {
  if (loading)
    return (
      <CircularProgressbarWithChildren
        value={100}
        text={`NA %`}
        className="xl:max-w-[38px] 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px] opacity-10"
        styles={{
          root: {
            // maxWidth: minW,
            // maxHeight: minW,
            imageRendering: 'crisp-edges',
            transform: 'scale(1)',
          },
          path: {
            stroke: 'grey',
          },
          text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'black' },
        }}
      >
        <div
          className="h-14 w-14 animate-spin rounded-full border-4 border-solid border-darkgrey border-t-transparent opacity-10"
          style={{ zIndex: -10 }}
        ></div>
      </CircularProgressbarWithChildren>
    );
  return (
    <>
      {progress === null ? (
        // No log indicator
        <CircularProgressbarWithChildren
          value={90}
          text={`NA %`}
          className="xl:max-w-[38px] 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px] opacity-50"
          styles={{
            root: {
              // maxWidth: minW,
              // maxHeight: minW,
              imageRendering: 'crisp-edges',
              transform: 'scale(1)',
            },
            path: { stroke: 'grey' },
            text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'black' },
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-40"
            height="70%"
            viewBox="0 -960 960 960"
            fill="grey"
          >
            <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
          </svg>
        </CircularProgressbarWithChildren>
      ) : problem ? (
        // Error log indicator
        <CircularProgressbarWithChildren
          value={progress}
          text={`${progress}%`}
          className="xl:max-w-[38px] 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px]"
          styles={{
            root: {
              // maxWidth: minW,
              // maxHeight: minW,
              imageRendering: 'crisp-edges',
              transform: 'scale(1)',
            },
            path: { stroke: '#DC3545' },
            text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'black' },
          }}
        >
          {problem === null ? (
            <></>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-40"
              height="70%"
              viewBox="0 -960 960 960"
              fill="#DC3545"
            >
              <path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240v-480h160v480H400Z" />
            </svg>
          )}
        </CircularProgressbarWithChildren>
      ) : (
        <CircularProgressbarWithChildren
          value={progress}
          text={`${progress}%`}
          className="xl:max-w-[38px] 1.5xl:max-w-[50px] 2xl:max-w-[60px] min-w-[38px]"
          styles={{
            root: {
              // maxWidth: minW,
              // maxHeight: minW,
              imageRendering: 'crisp-edges',
              transform: 'scale(1)',
            },
            path: { stroke: '#10B981' },
            text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'black' },
          }}
        >
          {problem === null ? (
            <></>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-40"
              height="70%"
              viewBox="0 -960 960 960"
              fill="#10B981"
            >
              <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
            </svg>
          )}
        </CircularProgressbarWithChildren>
      )}
    </>
  );
};

export default NumberLog;
