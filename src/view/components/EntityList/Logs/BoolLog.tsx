import { CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { Nullable } from '../../../../utils/types/typeUtils';

const BoolLog = ({ problem, loading }: { problem: Nullable<boolean>; loading: boolean }) => {
  if (loading) {
    return (
      <CircularProgressbarWithChildren
        value={100}
        className="relative opacity-10"
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
          className="opacity-20"
          height="70%"
          viewBox="0 -960 960 960"
          fill="grey"
        >
          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
        </svg>
        <div
          className="absolute h-full w-full animate-spin rounded-full border-4 border-solid border-darkgrey border-t-transparent opacity-20"
          style={{ zIndex: -10 }}
        ></div>
      </CircularProgressbarWithChildren>
    );
  }
  return (
    <>
      {problem === null ? (
        // No log indicator
        <CircularProgressbarWithChildren
          value={100}
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
            className="opacity-80"
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
          value={100}
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-80"
            height="70%"
            viewBox="0 -960 960 960"
            fill="#DC3545"
          >
            <path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240v-480h160v480H400Z" />
          </svg>
        </CircularProgressbarWithChildren>
      ) : (
        <CircularProgressbarWithChildren
          value={100}
          styles={{
            root: {
              imageRendering: 'crisp-edges',
              transform: 'scale(1)',
            },
            path: { stroke: '#10B981' },
            text: { fontSize: 28, textRendering: 'optimizeLegibility', fill: 'black' },
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-80"
            height="70%"
            viewBox="0 -960 960 960"
            fill="#10B981"
          >
            <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
          </svg>
        </CircularProgressbarWithChildren>
      )}
    </>
  );
};

export default BoolLog;
