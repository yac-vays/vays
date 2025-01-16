import { EntityTypeDecl } from '../../../model/EntityListFetcher';
import { EntityLog } from '../../../model/LogsFetcher';

const LogSummary = ({ logsDef, log }: { logsDef: EntityTypeDecl['logs'][0]; log: EntityLog[] }) => {
  return (
    <>
      {(function () {
        if (logsDef.problem && logsDef.progress) {
        }

        return <></>;
      })()}
    </>
    // <CircularProgressbar
    //   value={10}
    //   text={`${10}%`}
    //   styles={{
    //     root: { width: 60, imageRendering: 'crisp-edges', transform: 'scale(1)' },
    //     text: { fontSize: 25, textRendering: 'optimizeLegibility' },
    //   }}
    // />
  );
};
