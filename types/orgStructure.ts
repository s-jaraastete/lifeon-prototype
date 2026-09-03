export interface OrgSubprocess {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export interface OrgProcess {
  id: string;
  name: string;
  code?: string;
  description?: string;
  subprocesses: OrgSubprocess[];
}

export interface OrgArea {
  id: string;
  name: string;
  code?: string;
  workCenter?: string;
  description?: string;
  processes: OrgProcess[];
}

export interface OrgStructureState {
  areas: OrgArea[];
  lastUpdated?: string;
}
