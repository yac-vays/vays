import { CircularProgressbarWithChildren } from 'react-circular-progressbar';
import { progressColor } from '../../../../utils/logUtils';
import { Nullable } from '../../../../utils/types/typeUtils';

const GREEN = '#10B981';
const RED = '#DC3545';

const ringStyles = (stroke: string) => ({
  root: {
    imageRendering: 'crisp-edges' as const,
    transform: 'scale(1)',
  },
  path: { stroke },
  text: {
    fontSize: 28,
    textRendering: 'optimizeLegibility' as const,
    fill: 'currentcolor',
    // `dominant-baseline: central` centers the "%" text vertically; the
    // library stylesheet's `middle` sits high in most fonts.
    dominantBaseline: 'central' as const,
  },
});

const TickIcon = ({ fill, className }: { fill: string; className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    height="70%"
    viewBox="0 -960 960 960"
    fill={fill}
  >
    <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
  </svg>
);

const ExclamationIcon = ({ fill, className }: { fill: string; className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    height="70%"
    viewBox="0 -960 960 960"
    fill={fill}
  >
    <path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240v-480h160v480H400Z" />
  </svg>
);

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
        styles={ringStyles('grey')}
      >
        <div
          className="h-full w-full animate-spin rounded-full border-4 border-solid border-darkgrey border-t-transparent"
          style={{ zIndex: -10 }}
        ></div>
      </CircularProgressbarWithChildren>
    );

  if (progress === null)
    // No log indicator
    return (
      <CircularProgressbarWithChildren
        value={90}
        className="text-plainfont"
        text={`NA %`}
        styles={ringStyles('grey')}
      >
        <TickIcon fill="grey" className="opacity-40" />
      </CircularProgressbarWithChildren>
    );

  if (problem)
    // Failure: keep the ring at the current progress/color, replace the
    // percentage with the red exclamation mark (same as the bool indicator).
    return (
      <CircularProgressbarWithChildren
        value={progress}
        className="text-plainfont"
        styles={ringStyles(progressColor(progress))}
      >
        <ExclamationIcon fill={RED} className="opacity-80" />
      </CircularProgressbarWithChildren>
    );

  return (
    <CircularProgressbarWithChildren
      value={progress}
      className="text-plainfont"
      text={`${progress}%`}
      styles={ringStyles(progressColor(progress))}
    >
      {problem === null ? <></> : <TickIcon fill={GREEN} className="opacity-40" />}
    </CircularProgressbarWithChildren>
  );
};

export default NumberLog;
