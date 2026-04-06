// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Person CRUD
  personList:        ()          => ipcRenderer.invoke('person:list'),
  personFull:        (id)        => ipcRenderer.invoke('person:full', id),
  personCreate:      (d)         => ipcRenderer.invoke('person:create', d),
  personUpdate:      (id, d)     => ipcRenderer.invoke('person:update', id, d),
  personDelete:      (id)        => ipcRenderer.invoke('person:delete', id),
  personSetPronouns: (id, ids)   => ipcRenderer.invoke('person:setPronouns', id, ids),
  personSetTags:     (id, ids)   => ipcRenderer.invoke('person:setTags', id, ids),

  // Quotes
  quoteCreate:       (d)         => ipcRenderer.invoke('quote:create', d),
  quoteUpdate:       (id, d)     => ipcRenderer.invoke('quote:update', id, d),
  quoteDelete:       (id)        => ipcRenderer.invoke('quote:delete', id),

  // WordMouth
  wmCreate:          (d)         => ipcRenderer.invoke('wm:create', d),
  wmUpdate:          (id, d)     => ipcRenderer.invoke('wm:update', id, d),
  wmDelete:          (id)        => ipcRenderer.invoke('wm:delete', id),

  // Notes
  noteCreate:        (d)         => ipcRenderer.invoke('note:create', d),
  noteUpdate:        (id, d)     => ipcRenderer.invoke('note:update', id, d),
  noteDelete:        (id)        => ipcRenderer.invoke('note:delete', id),

  // Specifics
  specificCreate:    (d)         => ipcRenderer.invoke('specific:create', d),
  specificUpdate:    (id, d)     => ipcRenderer.invoke('specific:update', id, d),
  specificDelete:    (id)        => ipcRenderer.invoke('specific:delete', id),

  // Education
  eduCreate:         (d)         => ipcRenderer.invoke('edu:create', d),
  eduUpdate:         (id, d)     => ipcRenderer.invoke('edu:update', id, d),
  eduDelete:         (id)        => ipcRenderer.invoke('edu:delete', id),

  // Org
  orgCreate:         (d)         => ipcRenderer.invoke('org:create', d),
  orgUpdate:         (id, d)     => ipcRenderer.invoke('org:update', id, d),
  orgDelete:         (id)        => ipcRenderer.invoke('org:delete', id),

  // Social
  socialCreate:      (d)         => ipcRenderer.invoke('social:create', d),
  socialDelete:      (id)        => ipcRenderer.invoke('social:delete', id),

  // Media
  mediaCreate:       (d)         => ipcRenderer.invoke('media:create', d),
  mediaLink:         (pid, mid)  => ipcRenderer.invoke('media:link', pid, mid),
  mediaUnlink:       (pid, mid)  => ipcRenderer.invoke('media:unlink', pid, mid),

  // Lookups
  lookupAll:         ()          => ipcRenderer.invoke('lookup:all'),
  lookupAddCategory: (d)         => ipcRenderer.invoke('lookup:addCategory', d),
  lookupAddTag:      (n)         => ipcRenderer.invoke('lookup:addTag', n),
  lookupAddPronoun:  (t)         => ipcRenderer.invoke('lookup:addPronoun', t),
  lookupAddOrg:      (n)         => ipcRenderer.invoke('lookup:addOrg', n),
  lookupAddInst:     (d)         => ipcRenderer.invoke('lookup:addInst', d),

  // Phase A — new page data
  personBirthdays:      ()        => ipcRenderer.invoke('person:birthdays'),
  personRecentlyUpdated:(limit)   => ipcRenderer.invoke('person:recentlyUpdated', limit),
  personFavorites:      (limit)   => ipcRenderer.invoke('person:favorites', limit),
  personByTag:          ()        => ipcRenderer.invoke('person:byTag'),
});