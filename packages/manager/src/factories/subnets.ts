import Factory from 'src/factories/factoryProxy';

import type {
  Subnet,
  SubnetAssignedLinodeData,
} from '@linode/api-v4/lib/vpcs/types';

// NOTE: Changing to fixed array length for the interfaces and linodes fields of the
// subnetAssignedLinodeDataFactory and subnetFactory respectively -- see [M3-7227] for more details

export const subnetAssignedLinodeDataFactory = Factory.Sync.makeFactory<SubnetAssignedLinodeData>(
  {
    id: Factory.each((i) => i),
    interfaces: Array.from({ length: 5 }, () => ({
      active: false,
      id: Math.floor(Math.random() * 100),
    })),
  }
);

export const subnetFactory = Factory.Sync.makeFactory<Subnet>({
  created: '2023-07-12T16:08:53',
  id: Factory.each((i) => i),
  ipv4: '0.0.0.0/0',
  label: Factory.each((i) => `subnet-${i}`),
  linodes: Array.from({ length: 5 }, () =>
    subnetAssignedLinodeDataFactory.build({
      id: Math.floor(Math.random() * 100),
    })
  ),
  updated: '2023-07-12T16:08:53',
});
