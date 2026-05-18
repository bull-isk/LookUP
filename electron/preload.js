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
  personSearch:      (q)         => ipcRenderer.invoke('person:search', q),
  personBirthdays:       ()      => ipcRenderer.invoke('person:birthdays'),
  personRecentlyUpdated: (limit) => ipcRenderer.invoke('person:recentlyUpdated', limit),
  personFavorites:       (limit) => ipcRenderer.invoke('person:favorites', limit),
  personByTag:           ()      => ipcRenderer.invoke('person:byTag'),

  // Child data
  quoteCreate: (d)       => ipcRenderer.invoke('quote:create', d),
  quoteUpdate: (id, d)   => ipcRenderer.invoke('quote:update', id, d),
  quoteDelete: (id)      => ipcRenderer.invoke('quote:delete', id),
  wmCreate:    (d)       => ipcRenderer.invoke('wm:create', d),
  wmUpdate:    (id, d)   => ipcRenderer.invoke('wm:update', id, d),
  wmDelete:    (id)      => ipcRenderer.invoke('wm:delete', id),
  noteCreate:  (d)       => ipcRenderer.invoke('note:create', d),
  noteUpdate:  (id, d)   => ipcRenderer.invoke('note:update', id, d),
  noteDelete:  (id)      => ipcRenderer.invoke('note:delete', id),
  eduCreate:   (d)       => ipcRenderer.invoke('edu:create', d),
  eduUpdate:   (id, d)   => ipcRenderer.invoke('edu:update', id, d),
  eduDelete:   (id)      => ipcRenderer.invoke('edu:delete', id),
  orgCreate:   (d)       => ipcRenderer.invoke('org:create', d),
  orgUpdate:   (id, d)   => ipcRenderer.invoke('org:update', id, d),
  orgDelete:   (id)      => ipcRenderer.invoke('org:delete', id),
  socialCreate:(d)       => ipcRenderer.invoke('social:create', d),
  socialDelete:(id)      => ipcRenderer.invoke('social:delete', id),
  mediaCreate: (d)       => ipcRenderer.invoke('media:create', d),
  mediaLink:   (pid,mid) => ipcRenderer.invoke('media:link', pid, mid),
  mediaUnlink: (pid,mid) => ipcRenderer.invoke('media:unlink', pid, mid),

  // Lookups
  lookupAll:                  ()         => ipcRenderer.invoke('lookup:all'),
  lookupAddCategory:          (d)        => ipcRenderer.invoke('lookup:addCategory', d),
  lookupAddPronoun:           (t)        => ipcRenderer.invoke('lookup:addPronoun', t),
  lookupAddOrg:               (n)        => ipcRenderer.invoke('lookup:addOrg', n),
  lookupAddInst:              (d)        => ipcRenderer.invoke('lookup:addInst', d),
  lookupFindOrCreateTag:      (n)        => ipcRenderer.invoke('lookup:findOrCreateTag', n),
  lookupTagsWithCounts:       ()         => ipcRenderer.invoke('lookup:tagsWithCounts'),
  lookupPersonsByTag:         (id)       => ipcRenderer.invoke('lookup:personsByTag', id),
  lookupFindOrCreatePronoun:  (t)        => ipcRenderer.invoke('lookup:findOrCreatePronoun', t),
  lookupPrunePronouns:        ()         => ipcRenderer.invoke('lookup:prunePronouns'),
  lookupFindOrCreateCategory: (n, hex)   => ipcRenderer.invoke('lookup:findOrCreateCategory', n, hex),
  lookupPruneCategories:      ()         => ipcRenderer.invoke('lookup:pruneCategories'),

  specificsForPerson:         (pid)       => ipcRenderer.invoke('specifics:forPerson', pid),
  specificsTree:              ()          => ipcRenderer.invoke('specifics:tree'),
  specificsAddValue:          (d)         => ipcRenderer.invoke('specifics:addValue', d),
  specificsUpdateValue:       (id, note)  => ipcRenderer.invoke('specifics:updateValue', id, note),
  specificsDeleteValue:       (id)        => ipcRenderer.invoke('specifics:deleteValue', id),
  specificsFindOrCreateSub:   (name)      => ipcRenderer.invoke('specifics:findOrCreateSub', name),
  specificsFindOrCreatePoint: (sid, name) => ipcRenderer.invoke('specifics:findOrCreatePoint', sid, name),

  socialUpdate:             (id, tag)     => ipcRenderer.invoke('social:update', id, tag),
  personDeletePopulateTest: ()            => ipcRenderer.invoke('person:deletePopulateTest'),
  personImport:             (d)           => ipcRenderer.invoke('person:import', d),

  openExternal:          (url)            => ipcRenderer.invoke('shell:openExternal', url),
  lookupAddSocialPlatform:(name)          => ipcRenderer.invoke('lookup:addSocialPlatform', name),

  lookupFindOrCreateInstitution:  (name) => ipcRenderer.invoke('lookup:findOrCreateInstitution', name),
  lookupFindOrCreateOrganization: (name) => ipcRenderer.invoke('lookup:findOrCreateOrganization', name),

  mediaPick:    ()                   => ipcRenderer.invoke('media:pick'),
  mediaSetRole: (pid, mid, role)     => ipcRenderer.invoke('media:setRole', pid, mid, role),
});