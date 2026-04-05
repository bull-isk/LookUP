// renderer/src/api/bridge.js
// Single import point for all Electron API calls.
// React components NEVER call window.electronAPI directly.

const api = window.electronAPI;

export const personList        = ()         => api.personList();
export const personFull        = (id)       => api.personFull(id);
export const personCreate      = (d)        => api.personCreate(d);
export const personUpdate      = (id, d)    => api.personUpdate(id, d);
export const personDelete      = (id)       => api.personDelete(id);
export const personSetPronouns = (id, ids)  => api.personSetPronouns(id, ids);
export const personSetTags     = (id, ids)  => api.personSetTags(id, ids);

export const quoteCreate       = (d)        => api.quoteCreate(d);
export const quoteUpdate       = (id, d)    => api.quoteUpdate(id, d);
export const quoteDelete       = (id)       => api.quoteDelete(id);

export const wmCreate          = (d)        => api.wmCreate(d);
export const wmUpdate          = (id, d)    => api.wmUpdate(id, d);
export const wmDelete          = (id)       => api.wmDelete(id);

export const noteCreate        = (d)        => api.noteCreate(d);
export const noteUpdate        = (id, d)    => api.noteUpdate(id, d);
export const noteDelete        = (id)       => api.noteDelete(id);

export const specificCreate    = (d)        => api.specificCreate(d);
export const specificUpdate    = (id, d)    => api.specificUpdate(id, d);
export const specificDelete    = (id)       => api.specificDelete(id);

export const eduCreate         = (d)        => api.eduCreate(d);
export const eduUpdate         = (id, d)    => api.eduUpdate(id, d);
export const eduDelete         = (id)       => api.eduDelete(id);

export const orgCreate         = (d)        => api.orgCreate(d);
export const orgUpdate         = (id, d)    => api.orgUpdate(id, d);
export const orgDelete         = (id)       => api.orgDelete(id);

export const socialCreate      = (d)        => api.socialCreate(d);
export const socialDelete      = (id)       => api.socialDelete(id);

export const mediaCreate       = (d)        => api.mediaCreate(d);
export const mediaLink         = (pid, mid) => api.mediaLink(pid, mid);
export const mediaUnlink       = (pid, mid) => api.mediaUnlink(pid, mid);

export const lookupAll         = ()         => api.lookupAll();
export const lookupAddTag      = (n)        => api.lookupAddTag(n);
export const lookupAddOrg      = (n)        => api.lookupAddOrg(n);
export const lookupAddInst     = (d)        => api.lookupAddInst(d);