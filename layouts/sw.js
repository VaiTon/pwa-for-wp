const CACHE_VERSION = '{{CACHE_VERSION}}';

const BASE_CACHE_FILES = [
    {{PRE_CACHE_URLS}}
];

const OFFLINE_CACHE_FILES = [
     '{{OFFLINE_PAGE}}',
];

const NOT_FOUND_CACHE_FILES = [
    '{{404_PAGE}}',
];

const OFFLINE_PAGE = '{{OFFLINE_PAGE}}';
const NOT_FOUND_PAGE = '{{404_PAGE}}';

const CACHE_VERSIONS = {
    content: 'content-v' + CACHE_VERSION,
    notFound: '404-v' + CACHE_VERSION,
    offline: 'offline-v' + CACHE_VERSION,
};

// Define MAX_TTL's in SECONDS for specific file extensions
const MAX_TTL = {
    '/': {{HTML_CACHE_TIME}},
    html: {{HTML_CACHE_TIME}},
    json: {{CSS_CACHE_TIME}},
    js: {{CSS_CACHE_TIME}},
    css: {{CSS_CACHE_TIME}},
    png: {{CSS_CACHE_TIME}},
    jpg: {{CSS_CACHE_TIME}},
};

const CACHE_BLACKLIST =  [
//    (str) => {
//        return !str.includes('/wp-admin/') || !str.startsWith('{{SITE_URL}}/wp-admin/');
//    },
];
const neverCacheUrls = [/\/wp-admin/,/\/wp-login/,/preview=true/,{{EXCLUDE_FROM_CACHE}}];


const SUPPORTED_METHODS = [
    'GET',
];
// Check if current url is in the neverCacheUrls list
function checkNeverCacheList(url) {
    if ( this.match(url) ) {
        return false;
    }
    return true;
}
/**
 * isBlackListed
 * @param {string} url
 * @returns {boolean}
 */
function isBlacklisted(url) {
    return (CACHE_BLACKLIST.length > 0) ? !CACHE_BLACKLIST.filter((rule) => {
        if(typeof rule === 'function') {
            return !rule(url);
        } else {
            return false;
        }
    }).length : false
}

/**
 * getFileExtension
 * @param {string} url
 * @returns {string}
 */
function getFileExtension(url) {
    
    if (typeof url === 'string') {
     
        let split_two = url.split('?');
        let split_url = split_two[0];

        let extension = split_url.split('.').reverse()[0].split('?')[0];		
        return (extension.endsWith('/')) ? '/' : extension;
        
    }else{
        return null;
    }            
}
/**
 * getTTL
 * @param {string} url
 */
function getTTL(url) {
    if (typeof url === 'string') {
        let extension = getFileExtension(url);
        if (typeof MAX_TTL[extension] === 'number') {
            return MAX_TTL[extension];
        } else {
            return null;
        }
    } else {
        return null;
    }
}

/**
 * installServiceWorker
 * @returns {Promise}
 */
function installServiceWorker() {
    return Promise.all(
        [
            caches.open(CACHE_VERSIONS.content)
                .then(
                    (cache) => {
                        
                        if(BASE_CACHE_FILES.length >0){
                        
                            for (var i = 0; i < BASE_CACHE_FILES.length; i++) {
                            
                             precacheUrl(BASE_CACHE_FILES[i]) 
                       
                            }
                            
                        }
                        
                        //return cache.addAll(BASE_CACHE_FILES);
                    }
                ),
            caches.open(CACHE_VERSIONS.offline)
                .then(
                    (cache) => {
                        return cache.addAll(OFFLINE_CACHE_FILES);
                    }
                ),
            caches.open(CACHE_VERSIONS.notFound)
                .then(
                    (cache) => {
                        return cache.addAll(NOT_FOUND_CACHE_FILES);
                    }
                )
        ]
    )
        .then(() => {
            return self.skipWaiting();
        });
}

/**
 * cleanupLegacyCache
 * @returns {Promise}
 */
function cleanupLegacyCache() {

    let currentCaches = Object.keys(CACHE_VERSIONS)
        .map(
            (key) => {
                return CACHE_VERSIONS[key];
            }
        );

    return new Promise(
        (resolve, reject) => {

            caches.keys()
                .then(
                    (keys) => {
                        return legacyKeys = keys.filter(
                            (key) => {
                                return !~currentCaches.indexOf(key);
                            }
                        );
                    }
                )
                .then(
                    (legacy) => {
                        if (legacy.length) {
                            Promise.all(
                                legacy.map(
                                    (legacyKey) => {
                                        return caches.delete(legacyKey)
                                    }
                                )
                            )
                                .then(
                                    () => {
                                        resolve()
                                    }
                                )
                                .catch(
                                    (err) => {
                                        reject(err);
                                    }
                                );
                        } else {
                            resolve();
                        }
                    }
                )
                .catch(
                    () => {
                        reject();
                    }
                );

        }
    );
}

function precacheUrl(url) {

    if(!isBlacklisted(url)) {
        caches.open(CACHE_VERSIONS.content)
            .then((cache) => {
                cache.match(url)
                    .then((response) => {
                        if(!response) {
                            return fetch(url)
                        } else {
                            // already in cache, nothing to do.
                            return null
                        }
                    })
                    .then((response) => {
                        if(response) {
						
                        
                             
                             fetch(url).then(dataWrappedByPromise => dataWrappedByPromise.text())									
                                                    .then(data => {
												
							if(data){

                                                                const regex = {{REGEX}};

                                                                let m;

                                                                        while ((m = regex.exec(data)) !== null) {

                                                                                if (m.index === regex.lastIndex) {
                                                                                        regex.lastIndex++;
                                                                                }

                                                                                m.forEach((match, groupIndex) => {
                                                                                        if(groupIndex == 1){
                                                                                                 if(new URL(match).origin == location.origin){
                                                                                                        fetch(match).
                                                                                                                then((imagedata) => {
                                                                                                                        console.log(imagedata);
                                                                                                                        cache.put(match, imagedata.clone());

                                                                                                        });
                                                                                                    }

                                                                                        }


                                                                                });
                                                                        }


                                                        }


					});
											                                                                                						
                            return cache.put(url, response.clone());
                        } else {
                            return null;
                        }
                    });
            })
    }
}


self.addEventListener(
    'install', event => {
        event.waitUntil(
            Promise.all([
                installServiceWorker(),
                self.skipWaiting(),
            ])
        );
    }
);

// The activate handler takes care of cleaning up old caches.
self.addEventListener(
    'activate', event => {
        event.waitUntil(
            Promise.all(
                [
                    cleanupLegacyCache(),
                    self.clients.claim(),
                    self.skipWaiting(),
                ]
            )
                .catch(
                    (err) => {
                        self.skipWaiting();
                    }
                )
        );
    }
);

self.addEventListener(
    'fetch', event => {
        // Return if the current request url is in the never cache list
        if ( ! neverCacheUrls.every(checkNeverCacheList, event.request.url) ) {
          console.log( 'PWA ServiceWorker: URL exists in excluded list of cache.' );
          return;
        }
        
        // Return if request url protocal isn't http or https
        if ( ! event.request.url.match(/^(http|https):\/\//i) )
            return;
                
        {{EXTERNAL_LINKS}}
                
        event.respondWith(
            caches.open(CACHE_VERSIONS.content)
                .then(
                    (cache) => {

                        return cache.match(event.request)
                            .then(
                                (response) => {

                                    if (response) {

                                        let headers = response.headers.entries();
                                        let date = null;

                                        for (let pair of headers) {
                                            if (pair[0] === 'date') {
                                                date = new Date(pair[1]);
                                            }
                                        }

                                        if (date) {
                                            let age = parseInt((new Date().getTime() - date.getTime()));
                                            let ttl = getTTL(event.request.url);

                                            if (age > ttl) {

                                                return new Promise(
                                                    (resolve) => {

                                                        return fetch(event.request.clone())
                                                            .then(
                                                                (updatedResponse) => {
                                                                    if (updatedResponse) {
                                                                        cache.put(event.request, updatedResponse.clone());
                                                                        resolve(updatedResponse);
                                                                    } else {
                                                                        resolve(response)
                                                                    }
                                                                }
                                                            )
                                                            .catch(
                                                                () => {
                                                                    resolve(response);
                                                                }
                                                            );

                                                    }
                                                )
                                                    .catch(
                                                        (err) => {
                                                            return response;
                                                        }
                                                    );
                                            } else {
                                                return response;
                                            }

                                        } else {
                                            return response;
                                        }

                                    } else {
                                        return null;
                                    }
                                }
                            )
                            .then(
                                (response) => {
                                    if (response) {
                                        return response;
                                    } else {
                                        return fetch(event.request.clone())
                                            .then(
                                                (response) => {

                                                    if(response.status < 400) {
                                                        if (~SUPPORTED_METHODS.indexOf(event.request.method) && !isBlacklisted(event.request.url)) {
                                                            cache.put(event.request, response.clone());
                                                        }
                                                        return response;
                                                    } else {
                                                        return caches.open(CACHE_VERSIONS.notFound).then((cache) => {
                                                            return cache.match(NOT_FOUND_PAGE);
                                                        })
                                                    }
                                                }
                                            )
                                            .then((response) => {
                                                if(response) {
                                                    return response;
                                                }
                                            })
                                            .catch(
                                                () => {

                                                    return caches.open(CACHE_VERSIONS.offline)
                                                        .then(
                                                            (offlineCache) => {
                                                                return offlineCache.match(OFFLINE_PAGE)
                                                            }
                                                        )

                                                }
                                            );
                                    }
                                }
                            )
                            .catch(
                                (error) => {
                                    console.error('  Error in fetch handler:', error);
                                    throw error;
                                }
                            );
                    }
                )
        );

    }
);


self.addEventListener('message', (event) => {

    if(
        typeof event.data === 'object' &&
        typeof event.data.action === 'string'
    ) {
        switch(event.data.action) {
            case 'cache' :               
                precacheUrl(event.data.url);
                break;
            default :
                console.log('Unknown action: ' + event.data.action);
                break;
        }
    }

});

{{OFFLINE_GOOGLE}}
{{FIREBASEJS}}
