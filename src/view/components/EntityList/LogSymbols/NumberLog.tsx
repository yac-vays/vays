import { CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { Nullable } from '../../../../utils/types/typeUtils';

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
        className="text-plainfont opacity-10"
        text={`NA %`}
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
          text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'currentcolor' },
        }}
      >
        <div
          className="h-full w-full animate-spin rounded-full border-4 border-solid border-darkgrey border-t-transparent opacity-20"
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
          className="text-plainfont"
          text={`NA %`}
          styles={{
            root: {
              // maxWidth: minW,
              // maxHeight: minW,
              imageRendering: 'crisp-edges',
              transform: 'scale(1)',
            },
            path: { stroke: 'grey' },
            text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'currentcolor' },
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
          className="text-plainfont"
          text={`${progress}%`}
          styles={{
            root: {
              // maxWidth: minW,
              // maxHeight: minW,
              imageRendering: 'crisp-edges',
              transform: 'scale(1)',
            },
            path: { stroke: '#DC3545' },
            text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'currentcolor' },
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
          className="text-plainfont"
          text={`${progress}%`}
          styles={{
            root: {
              // maxWidth: minW,
              // maxHeight: minW,
              imageRendering: 'crisp-edges',
              transform: 'scale(1)',
            },
            path: { stroke: '#10B981' },
            text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'currentcolor' },
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
