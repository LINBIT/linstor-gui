import PageBasic from '@app/components/PageBasic';
import React from 'react';
import { StyledUL } from './styled';
import { PhysicalStorageList } from '@app/features/vsan';

export const PhysicalStorage = () => {
  return (
    <PageBasic title="Physical Storage">
      <div>
        <p>
          Below is a representation of which storage devices are present on which of your nodes. Check the respective
          boxes to combine multiple storage devices into a storage pool. LINSTOR will then view this storage pool as a
          single &quot;chunk&quot; of storage and use it to create virtual storage volumes.
        </p>
        <p>Hover over the entries to see the path for each device on a particular node.</p>
        <b>Important:</b> To appear on this list, a storage device:
        <StyledUL>
          <li>Must be greater than 1GiB.</li>
          <li>
            Must be <b>completely empty</b>. This includes file systems, LVM signatures, and others. If there is
            existing data on the device, wipe it first (for example, using <code>wipefs -a</code>).
          </li>
        </StyledUL>
      </div>

      <PhysicalStorageList />
    </PageBasic>
  );
};
