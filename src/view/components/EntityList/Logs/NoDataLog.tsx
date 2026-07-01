import { CircularProgressbarWithChildren } from 'react-circular-progressbar';

/**
 * Uniform placeholder for a log slot that has no data. Shown for every log type
 * (bool / number / message) so an entity without logs looks the same everywhere:
 * a grey ring with a centered question mark. While the logs are still being
 * fetched a spinner (in a slightly lighter grey) replaces the question mark —
 * the ring itself is unchanged, so nothing shifts when the real log loads.
 */
const NoDataLog = ({ loading }: { loading: boolean }) => {
  return (
    <CircularProgressbarWithChildren
      value={100}
      className="opacity-60"
      styles={{
        root: { imageRendering: 'crisp-edges', transform: 'scale(1)' },
        path: { stroke: 'grey' },
      }}
    >
      {loading ? (
        // Slightly lighter grey than the 'grey' ring; centered by the library's
        // children wrapper so it occupies the same box as the question mark.
        <div className="h-3/5 w-3/5 animate-spin rounded-full border-[3px] border-solid border-[#a8a8a8] border-t-transparent" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-70"
          height="58%"
          viewBox="0 -960 960 960"
          fill="grey"
        >
          <path d="M424-320q0-81 14.5-116.5T500-514q41-36 62.5-62.5T584-637q0-41-27.5-68T480-732q-51 0-77.5 31T365-638l-103-44q21-64 77-111t141-47q105 0 161.5 58.5T698-641q0 50-21.5 85.5T609-475q-49 47-59.5 71.5T539-320H424Zm56 240q-33 0-56.5-23.5T400-160q0-33 23.5-56.5T480-240q33 0 56.5 23.5T560-160q0 33-23.5 56.5T480-80Z" />
        </svg>
      )}
    </CircularProgressbarWithChildren>
  );
};

export default NoDataLog;
