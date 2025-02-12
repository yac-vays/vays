import { useEffect, useState } from 'react';
import { collisionGetDiff } from '../../controller/local/EditController/StandardMode/concurrency';
import { RequestEditContext } from '../../utils/types/internal/request';
import SubLoader from '../thirdparty/components/SubLoader';

export interface ConcurrencyReportProps {
  name: string;
  requestEditContext: RequestEditContext;
  oldYaml?: string;
}

const ConcurrencyReport = ({ name, requestEditContext, oldYaml }: ConcurrencyReportProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [content, setContent] = useState<string>('');
  useEffect(() => {
    (async () => {
      setContent(await collisionGetDiff(name, requestEditContext, oldYaml));
      setIsLoading(false);
    })();
    return () => setIsLoading(true);
  }, []);

  return <div>{isLoading ? <SubLoader action="Computing Difference" /> : content}</div>;
};

export default ConcurrencyReport;
