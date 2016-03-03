/**
 * IS24 Corporate website javascript library
 * 
 * @projectTitle        LIB
 * @projectDescription  Empty class (for structure)
 * @namespace           is24c + (.comp, .config, .lib)
 * 
 * @author              Heimann, ACHTGRAU GmbH
 * @version             2013.12.12
 * @copyright           Immobilien Scout GmbH, 2013-2014
 */

// create IS24 namespace and subtree
var is24c = is24c || {};

can.extend(is24c, {
    comp: {}, // components
    config: {}, // serverside generated config information
    lib: {} // library
});


$(function() {

    // Extend can.Construct prototype to catch initialization errors
    can.Construct.prototype.init = function(args) {
        try {
            // add a common variable store
            this._var = {};
            // naming convention: "start"
            this.start(args);
        } catch(e) {
            is24c.lib.debug.log('Component init failed for ' + this.constructor.fullName, 'error');
        }
    };


    // Overwrite can.Control setup method to support deep recursion for this.options
    var setup = can.Control.prototype.setup;
    can.Control.prototype.setup = function(element, options) {
        // setup returns [this.element, this.options]
        var initData = can.proxy(setup, this)(element, options);

        // Option merging. (Added deep recursion flag)
        this.options = can.extend(true, {}, this.constructor.defaults, options);

        return [ initData[0], this.options ];
    };

    // Extend can.Control prototype to log and harmonize DOM changed function call
    can.Control.prototype.triggerReInit = function() {
        try {
            is24c.lib.debug.log(['DOM changed: update triggered on ' + this.constructor.shortName, this.element], 'info');

            // naming convention: "reinit"
            this.reinit();
        } catch(e) {
            is24c.lib.debug.log('DOM changed: update failed on ' + this.constructor.fullName, 'error');
        }
    };

});

// IS24
var IS24 = IS24 || {};
IS24.isIE = /*@cc_on!@*/0;
IS24.registerNS = function (ns) {
    var i,
        nsParts = ns.split("."),
        root = window;
    for (i=0; i<nsParts.length; i++) {
        if (root[nsParts[i]] === undefined) { root[nsParts[i]] = {}; }
        root = root[nsParts[i]];
    }
};

/**
 * IS24 Corporate website javascript library
 * 
 * @projectTitle        DEBUG
 * @projectDescription  Provides debugging helper functions
 * @namespace           is24c.lib.debug
 * 
 * @author              Heimann, ACHTGRAU GmbH
 * @version             2013.12.12
 * @copyright           Immobilien Scout GmbH, 2013-2014
 */

$(function() {

    can.Construct.extend('is24c.classes.lib.debug', {
        
        // logging is enabled by default
        logEnabled: true
    
    }, {

        start: function(el) {
            
            // check if logging has been disabled on element (body) level
            // fetch data by evaluating script config directly, 'cause is24c.lib.util isn't initialized yet
            var script = can.$(el).children('script.config'),
                config = eval( script.html() );
            this.constructor.logEnabled = config !== undefined ? config.config.logEnabled : this.constructor.logEnabled;
            
            // force logging if url param (logging=true) is given
            var params = window.location.search;

            if (params !== undefined) {
                params = can.deparam(params.substring(1, params.length));
                
                if (params.logging !== undefined) {
                    this.constructor.logEnabled = (params.logging == "true");
                }
            }

            // Avoid `console` errors in browsers that lack a console.
            if (!(window.console && console.log)) {
                (function() {
                    var noop = function() {};
                    var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
                    var length = methods.length;
                    var console = window.console = {};
                    while (length--) {
                        console[methods[length]] = noop;
                    }
                }());
            }
        },
    
        /**
         * proxy function for console object
         * @param {String} msg - message to be displayed
         * @param {String} type - type of message
         */
        log: function(msg, type) {
            if (this.constructor.logEnabled) {
                type !== undefined ? console[type](msg) : console.log(msg);
            }
        }
    });

    // create new instance
    is24c.lib.debug = new is24c.classes.lib.debug('body');

});

/**
 * IS24 Corporate website javascript library
 * 
 * @projectTitle        UTIL
 * @projectDescription  Provides utility functions
 * @namespace           is24c.lib.util
 * 
 * @author              Heimann, ACHTGRAU GmbH
 * @version             2013.12.12
 * @copyright           Immobilien Scout GmbH, 2013-2014
 */

$(function() {

    can.Construct.extend('is24c.classes.lib.util', {

        defaults: {
            cssContext: '#ui',
            imagesLoaded: false,
            mediaQueries: {
                mobile: 'screen and (max-width: 767px)',
                tabletPortrait: 'screen and (min-width: 768px) and (max-width: 1023px)',
                tabletLandscape: 'screen and (min-width: 1024px) and (max-width: 1111px)',
                desktop: 'screen and (min-width: 1112px)'
            }
        }

    }, {
        
        start: function(root) {
            // init all component configurations
            root = root !== undefined ? can.$(root) : can.$('body');
            is24c.lib.debug.log(this.getDomName(root) + ' (root element): init component configurations', 'info');

            this.initConfig(root);
            this.images.setLoaded(this.constructor.defaults.imagesLoaded);
            this.mqMatch.register(this);
        },
    
        /**
         * retrieve the names of the DOM nodes and the classname (if existent)
         * @param {Object} el - Nodelist
         */
        getDomName: function(el) {
            return el.length > 0 ? el[0].nodeName + ' (' + el[0].className + ')' : el.nodeName + ' (' + el.className + ')'; 
        },

        /**
         * test wether the object has a given property or not (no deep recursion)
         * @param {Object} obj - object with properties
         * @param {String} prop - property to test for
         */
        hasProperty: function(obj, prop) {
            return obj && obj[prop] && obj[prop] !== undefined && obj[prop] !== '' ? true : false;
        },

        /**
         * parse and init component config
         * @param {Object} root - dom root element to search for script.config
         */
        initConfig: function(root) {
            var lib = this;
            can.each(can.makeArray(can.$('script.config', root)), function(value) {
                var script = can.$(value);

                // get config content
                var config = eval( script.html() );
                // check if parent dom node or dom node with certain classname should be chosen
                var component = lib.hasProperty(config, 'name') ? script.closest('.' + config.name) : script.parent();
                
                // write config
                lib.setConfig(component, config.config);
            });
        },
        
        /**
         * get component config (data attribute)
         * @param {String} element - css selector
         * @param {Boolena} forceReinit - true to read data from script config and not from data attribute
         * @return {Array/String} - configuration information
         */
        getConfig: function(element, forceReinit) {
            if (forceReinit) {
                this.initConfig(element);
            }
            return can.data( can.$(element), 'config');
        },
        
        /**
         * set component config (data attribute)
         * @param {String} element - css selector
         * @param {Object} config - configuration data
         * 
         */
        setConfig: function(element, config) {
            if (element !== undefined) {
                if (config !== undefined) {
                    can.data( can.$(element), 'config', config);
                    is24c.lib.debug.log(this.getDomName(element) + ': data on component was set', 'info');
                } else {
                    is24c.lib.debug.log(this.getDomName(element) + ' component configuration missing or corrupt: data on component was not set', 'warn');
                }
            } else {
                is24c.lib.debug.log('component missing: data on component was not set', 'warn');
            }
        },
        
        /**
         * setup new instances of a registered control class
         * @param {String} componentClass - component class name
         * @param {Object} superClass - component super class
         * @param {String} cssClassname - css class name of component
         * @param {String} cssContext - css context in which the component should be searched and registered
         * @param {Boolena} forceReinit - true to read data from script config and not from data attribute
         */
        setupControl: function(componentClass, superClass, cssClassname, cssContext, forceReinit) {
            // extend component tree
            is24c.comp[componentClass] = [];
            
            // use superclass or class
            var instance = superClass || is24c.classes.comp[componentClass];
        
            // get nodes
            var nodes = this.getControlNodes(componentClass, cssClassname, cssContext);

            // create new instances
            var registered = true;
            can.each(can.makeArray(nodes), function(value) {
                try {
                    is24c.comp[componentClass].push(new instance( value, is24c.lib.util.getConfig(value, forceReinit) ));
                } catch(e) {
                    registered = false;
                }
            });

            if (registered) {
                if (nodes.length == 0) {
                    is24c.lib.debug.log('No components with class "' + componentClass + '" on page', 'info');
                } else {
                    is24c.lib.debug.log([
                        'Component class "' + componentClass + '" has been registered',
                        'number of components: ' + nodes.length,
                        nodes
                    ], 'info');
                }
            } else {
                is24c.lib.debug.log('Component registration failed for ' + componentClass, 'error');
            }
        },

        /**
         * get nodes with given css classname and context
         * @param {String} componentClass - component class name
         * @param {String} cssClassname - css class name of component
         * @param {String} cssContext - css context in which the component should be searched and registered
         */
        getControlNodes: function(componentClass, cssClassname, cssContext) {
            return can.$((cssContext || this.constructor.defaults.cssContext) + ' .' + (cssClassname || componentClass));
        },

        /**
         * extend control class
         * @param {String} componentClass - component class name
         * @param {Object} value - DOM component
         */
        extendControl: function(componentClass, value) {
            if (is24c.lib.util.isBlank(is24c.comp[componentClass])) {
                is24c.lib.debug.log('Component class "' + componentClass + '" couldn\'t be extended: it hasn\'t been registered yet', 'warn');
            } else {
                is24c.lib.debug.log('Component class "' + componentClass + '" has been extended', 'info');
                is24c.comp[componentClass].push(new is24c.classes.comp[componentClass]( value, is24c.lib.util.getConfig(value) ));
            }
        },

        /**
         * find specific control for a DOM element and destroy it
         * @param {String} componentClass - component class name
         * @param {Object} el - DOM element
         * @return {Object} the control
         */
        destroyControl: function(componentClass, el) {
        	var control,
        	    comps = [];

        	// find control by DOM element and collect remaining controls of this type
        	can.each(is24c.comp[componentClass], function(item) {
        		if(item.element[0] == el) {
        			control = item;
        		} else {
        			comps.push(item);
        		}
        	});

        	if(control) {
                is24c.lib.debug.log('Destroying control with component class "' + componentClass + '"', 'info');
        		is24c.comp[componentClass] = comps;
        		control.destroy();
        	}
        },

        /**
         * test if one of the given browsers is detected (depends on modernizr!)
         * @param {Array} browsers - Array of browser classes to test for (e.g. 'ie6')
         * @return {Boolean} - test result
         */
        isBrowser: function(browsers) {
            var test = false;
            for (var i = 0; i < browsers.length; i++) {
                if ($('html').hasClass(browsers[i])) {
                    test = true;
                    break;
                }
            }
            return test;
        },
        
        /**
         * check whether the given object is blank
         * it identifies any object that evaluates to false (null, undefined, [], {}) or a whitespace string as blank.
         * boolean true/false evaluates to false(!)
         * 
         * Credits:
         * Lakshan Perera (http://www.laktek.com/2011/01/07/jquery-isblank/)
         * 
         * @param {Object} obj - object to test for
         * @return {Boolean} - test result
         */
        isBlank: function(obj) {
            // check: undefined or null
            if (obj === undefined || obj === null) {
                return true;
            };
            // skip number and boolean (!)
            if (typeof(obj) === "number" || typeof(obj) === "boolean") {
                return false;
            }
            // check empty array
            if (can.isArray(obj) && obj.length === 0) {
                return true;
            }
            // check: empty object or empty string 
            return typeof(obj) === "object" ? can.isEmptyObject(obj) : can.trim(obj) === "";
        },

        /**
         * retrieve local storage object
         * @param {String} key - key to search for in local storage
         * @return {Array} - stored data
         */
        getStorage: function(key) {
            var data;
            if (Modernizr.localstorage) {
                data = localStorage.getItem(key);
                is24c.lib.debug.log({
                    'local storage': 'read',
                    key: key,
                    data: JSON.parse(data)
                }, 'info');
                data = JSON.parse(data);
            }
            return data;
        },

        /**
         * store data in local storage object
         * @param {String} key - key to store in local storage
         * @param {Object} data -data to store
         */
        setStorage: function(key, data) {
            if (Modernizr.localstorage) {
                is24c.lib.debug.log({
                    'local storage': 'write',
                    key: key,
                    data: data
                }, 'info');
                localStorage.setItem(key, JSON.stringify(data));
            }
        },

        /**
         * clean data from local storage object
         * @param {String} key - key to remove from local storage
         */
        clearStorage: function(key) {
            if (Modernizr.localstorage) {
                is24c.lib.debug.log({
                    'local storage': 'clear',
                    key: key
                }, 'info');
                localStorage.removeItem(key);
            }
        },

        /**
         * open new browser window
         * @param {String} url - url to open
         * @param {Object} customOptions - custom window options
         * @return {window} - new window object
         */
        openWindow: function(url, customOptions) {
            var defaultOptions = {
                height: 700,
                location: 0,
                menubar: 0,
                toolbar: 0,
                width: 500
            };
            can.extend(defaultOptions, customOptions);
            
            return window.open(url, 'newWindow', can.param(defaultOptions).replace(/&/g, ','));
        },

        /**
         * get the device pixel ratio, if present
         * @return {Float} - device pixel ratio
         */
        getDevicePixelRatio: function() {
            return is24c.lib.util.isBlank(window.devicePixelRatio) ? 1 : window.devicePixelRatio;
        },

        /**
         * get the scale factor for the current body font-size in contrast to the base font-size
         * @return {Float} - scale
         */
        getFontSizeScale: function() {
            var bodyFontSize = parseInt(can.$('body').css('font-size')),
                scale = bodyFontSize / is24c.lib.util.getConfig('body').baseFontSize;

            return isNaN(scale) ? 1 : scale;
        },

        /**
         * enquire.js and media.match.js based media query tests
         * Enquire 2.1.0 - Media Query Matcher, http://wicky.nillia.ms/enquire.js
         * MediaMatch 2.0.2 - Testing css media queries in Javascript. Authors & copyright (c) 2013: WebLinc, David Knight, https://twitter.com/mediamatchjs
         */
        mqMatch: {

            /**
             * register enquire.js events for each media query
             * test if polyfill for IE browsers is needed and load it
             * @apram {Object} util - is24c.lib.util object
             */
            register: function(util) {
                this.util = util;

                // IE 8/9  have already received a polyfill
                if (window.matchMedia || window.msMatchMedia) {
                    can.each(util.constructor.defaults.mediaQueries, function(value, key) {
                        // register enquire.js events for each media query
                        enquire.register(value, {
                            setup: function() {
                                util.mqMatch.set(key, false);
                            },
                            match: function() {
                                util.mqMatch.set(key, true);
                            },
                            unmatch: function() {
                                util.mqMatch.set(key, false);
                            }
                        });
                    });
                }
            },
    
            /**
             * get media query test result
             * @param {String} match - media query key
             * @return {Boolean} - media query test result
             */
            get: function(match) {
                return is24c.lib.util.isBlank(is24c.config.mq) ? false : is24c.config.mq[match];
            },
    
            /**
             * extends media query checks with updated value
             * @param {String} match - media query key
             * @param {Boolean} result - media query test result
             */
            set: function(match, result) {
                if (this.util.isBlank(is24c.config.mq)) {
                    is24c.config.mq = {};
                }
    
                is24c.config.mq[match] = result;
            }

        },

        /**
         * flag to determine images loaded state
         */
        images: {

            /**
             * retrieve loaded state
             * @return {Boolean} - loaded state
             */
            getLoaded: can.proxy(function() {
                return this.images._areLoaded;
            },this),

            /**
             * set loaded state
             * @param {Boolean} state - true/false
             */
            setLoaded: can.proxy(function(state) {
                this.images._areLoaded = state;
            }, this)

        },

        /**
         * Smooth scroll function based on css transitions instead of jQuery animate
         * Currently only supports Y direction
         * 
         * Modified from and credits to:
         * http://mitgux.com/smooth-scroll-to-top-using-css3-animations
         * 
         * @param {Int} targetPosition - target scroll position
         * @param {Object} animationProperties - animation properties
         */
        smoothScroll: function(targetPosition, animationProperties) {
            targetPosition = parseInt(targetPosition) || 0;
            animationProperties = animationProperties || {
                duration: 500,
                easing: 'swing'
            };

            // element to animate
            var element = can.$('body'),
                animationName = 'scroll';

            // switch for animation (css vs jQuery animate)
            if (Modernizr.cssanimations) {
                var animationEvent = 'animationend mozAnimationEnd msAnimationEnd oAnimationEnd webkitAnimationEnd';

                // Get the current scroll position
                var position = $(window).scrollTop();

                // calculate distance to target scroll position
                var distance = -(targetPosition - position);

                // test if target position is still inside viewport
                var viewportHeight = document.documentElement.clientHeight < window.innerHeight ? window.innerHeight : document.documentElement.clientHeight,
                    maxDistance = element.outerHeight(true) - viewportHeight - position;

                if (-distance > maxDistance) {
                    distance = -maxDistance;
                }

                // remove former animation and event
                can.$('#keyframes-' + animationName).remove();
                element.off(animationEvent);

                // add new keyframes animation and add to document
                var prefixes = ['', '-moz-', '-ms-', '-o-', '-webkit-'];
                
                function generateKeyframes(prefix, distance) {
                    var keyframes = '@' + prefix + 'keyframes ' + animationName +' {';
                    keyframes += 'from { ' + prefix + 'transform: translateY(0); }';
                    keyframes += 'to { ' + prefix + 'transform: translateY(' + distance + 'px); }';
                    keyframes += '}';

                    return keyframes;
                }

                var style = '<style type="text/css" id="keyframes-' + animationName + '">';
                for (var i=0; i < prefixes.length; i++) {
                    style += generateKeyframes(prefixes[i], distance);
                }
                style += '</style>';

                can.$('head').append(style);
                element.addClass('scroll');

                // set scrollbar to correct position and remove css animation
                element.on(animationEvent, function() {
                    can.$(window).scrollTop(targetPosition);
                    element.removeClass('scroll');
                });

            } else {

                if (navigator.userAgent.toLowerCase().indexOf('webkit') === -1) {
                    element = can.$('html');
                }

                element.animate({
                    scrollTop: targetPosition
                }, animationProperties);
            }
        },

        /*
         * Collapsible behavior with slideToggle animation.
         *
         * Example:
         * <div class="contact" data-type="collapsible" data-target=".content" data-trigger="h3">
         *     <h3>Clickable Header</h3>
         *     <div class="content">collapsible content here </div>
         * </div>
         */
        collapsible: {
            triggerNode     : null,
            targetNode      : null,
            node            : null,
            defaults: {
                openedClass     : 'open',
                easing          : 'ease',
                duration        : 500
            },

            /*
            * Gathers required DOM nodes, adds animation wrapper node.
            * @param {Object} component - Can Component object; passed in via this.element
            * @param {Object} config - Pass in your custom params for defaults{}
            * @return {Object} Returns involved DOM nodes e.g. triggerNode, targetNode, parentNode
            * */
            init: function (component, config) {

                // Merge config
                can.extend(this.defaults, config);

                can.each(can.makeArray(can.$('[data-type="collapsible"]', component).andSelf()), can.proxy(function (obj) {

                    var targetNode      = can.$(can.$(obj).attr('data-target'), component),
                        triggerNode     = can.$(can.$(obj).attr('data-trigger'), component),
                        node            = can.$(obj, this.element);

                    can.$(targetNode).wrapInner('<div class="inner" />');

                    this.targetNode        = targetNode.find('> .inner');
                    this.triggerNode       = triggerNode;
                    this.node              = node;
                }, this));

                if(this.targetNode && this.triggerNode && this.node) {
                    this.bind();
                }

                return {
                    targetNode  : this.targetNode,
                    triggerNode : this.triggerNode,
                    node        : this.node
                };
            },

            /**
            * Bind name-spaced click event to triggerNode
            * @return {}
            */
            bind: function () {

                this.triggerNode.on('click.collapsible', {
                    targetNode: this.targetNode,
                    node: this.node
                }, can.proxy(this.slideToggle, this));
            },

            /**
            * Bind click event to triggerNode
            * @return {}
            */
            unbind: function () {
                this.triggerNode.unbind('click.collapsible');
            },

            /**
             * Slide toggle targetNode; see .bind()
             * @param {Object} ev - event object
             * @param {Object} targetNode jQuery object to be animated
             * @param {Object} parentNode jQuery animated object's parent used for CSS state toggling
             *
             * @return {}
             */
            slideToggle: function (ev, targetNode, parentNode, callback) {

                targetNode  = targetNode || ev.data.targetNode;
                parentNode  = parentNode || ev.data.node;

                var c           = this,
                    nodeHeight  = targetNode.outerHeight();

                targetNode.transition({
                    marginTop   : parseInt(targetNode.css('margin-top')) >= 0 ? -nodeHeight : 0,
                    easing      : c.defaults.easing,
                    duration    : c.defaults.duration
                }, function () {
                    can.$(parentNode)
                        .toggleClass(c.defaults.openedClass, (parseInt(targetNode.css('margin-top')) == '0') );

                    if(typeof callback == 'function') {
                        callback();
                    }
                });
            }
        }
    });

    // create new instance
    is24c.lib.util = new is24c.classes.lib.util();

});

/**
 * IS24 Corporate website javascript library
 * 
 * @projectTitle        PERFORMANCE
 * @projectDescription  Connection tests
 * @namespace           is24c.lib.perf
 * 
 * @author              Heimann, ACHTGRAU GmbH
 * @version             2013.12.12
 * @copyright           Immobilien Scout GmbH, 2013-2014
 */

$(function() {

    can.Construct.extend('is24c.classes.lib.perf', {
        
        connection: {
            localStorageKey: 'is24corporate-connection-test',
            minKbpsForHighBandwidth: 300,
            statusComplete: 'complete',
            testExpireMinutes: 30,
            testKB: 57.7 // this value needs to be updated every time is24.corporate.libs.body.js changes in file size !!!
        }

    }, {
        
        start: function(el) {
            this.perf = {
                connection: {},
                controlpoint: {}
            };
            can.extend(this.perf.controlpoint, window.perf);

            // start connection test (bandwidth detection)
            this.connectionTest();

            // clean up
            delete window.perf;
        },

        /**
         * Code loosely based on foresight.js bandwidth detection and adapted to IS24 specifics
         * For details see: https://github.com/adamdbradley/foresight.js
         */
        connectionTest: function() {
            var ccn = this.constructor.connection,
                cn = this.perf.connection;

            // set some default for bandwidth
            cn.bandwidth = 'low';
            
            // force that this device has a low or high bandwidth, used more so for debugging purposes
            if (ccn.forcedBandwidth) {
                cn.bandwidth = ccn.forcedBandwidth;
                cn.result = 'forced';
                cn.status = ccn.statusComplete;
                return;
            }
    
            // use Modernizr network detection feature 
            if (Modernizr.lowbandwidth) {
                // we know this connection is slow, don't bother even doing a speed test
                cn.result = 'connTypeSlow';
                cn.status = ccn.statusComplete;
                return;
            }
    
            // check if a speed test has recently been completed and its 
            // results are saved in the local storage
            try {
                var connectionTestData = is24c.lib.util.getStorage(ccn.localStorageKey);
                if (connectionTestData !== null) {
                    if ((new Date()).getTime() < connectionTestData.expire) {
                        // already have connection data within our desired timeframe
                        // use this recent data instead of starting another test
                        cn.bandwidth = connectionTestData.bandwidth;
                        cn.kbps = connectionTestData.kbps;
                        cn.result = 'localStorage';
                        cn.status = ccn.statusComplete;
                        return;
                    }
                }
            } catch(e) {}
    
            
            // calculate new bandwidth
            if (!is24c.lib.util.isBlank(this.perf.controlpoint.connection)) {
                cn.duration = (this.perf.controlpoint.connection.stop - this.perf.controlpoint.connection.start) / 1000;
                cn.kbps = parseInt(((ccn.testKB * 1024 * 8) / cn.duration) / 1024);
                cn.bandwidth = (cn.kbps >= ccn.minKbpsForHighBandwidth ? 'high' : 'low');
                cn.result = 'networkSuccess';

                // store results in localstorage
                try {
                    is24c.lib.util.setStorage(ccn.localStorageKey, {
                        bandwidth: cn.bandwidth,
                        expire: (new Date()).getTime() + (ccn.testExpireMinutes * 60000),
                        kbps: cn.kbps
                    });
                } catch(e) {}
            }

            cn.status = ccn.statusComplete;
        },
    
        /**
         * make speed test results accessible
         * @return {Object} - speed test results
         */
        getConnectionTestResults: function() {
            return this.perf.connection;
        }

    });

    // create new instance
    is24c.lib.perf = new is24c.classes.lib.perf();

});

/**
 * IS24 Corporate website javascript library
 * 
 * @projectTitle        EVENT
 * @projectDescription  Provides event helper functions
 * @namespace           is24c.lib.event
 * 
 * @author              Heimann, ACHTGRAU GmbH
 * @version             2013.12.12
 * @copyright           Immobilien Scout GmbH, 2013-2014
 */

$(function() {

    can.Construct.extend('is24c.classes.lib.event', {
        
        start: function(el) {
            this.registerImagesLoadedEvent();
            this.registerWindowDebouncedResizeEvent();
            //this.registerOrientationChangedEvent();
        },
    
        /**
         * stop event completely (default + propagation)
         * @param {Event Object} ev - event object
         */
        stop: function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
        },
        
        /**
         * register global DOM changed event on document for given component class
         * check if component
         * - needs to be destroyed and registered new
         * - OR can be reinited directly 
         * @param {String} componentClass - component class
         * @param {String} superClass - component super class
         * @param {String} cssClassname - css class of component
         * @param {String} cssContext - css context in which the component should be searched and registered
         */
        registerDomChangedEvent: function(componentClass, superClass, cssClassname, cssContext) {
            
            can.bind.call(document, 'domChanged', function(ev, args) {
                /**
                 * @param {Event} ev - custom event
                 * @param {Object} args - (optional) component class to force doSetup 
                 */
                var doSetup = false,
                    compLength = is24c.comp[componentClass].length,
                    args = componentClass == args ? true : false;

                // mark components with no instances as to be reinitialized
                if (args || compLength === 0 || compLength < is24c.lib.util.getControlNodes(componentClass, cssClassname, cssContext).length) {
                    doSetup = true;
                } else {
                    can.each(is24c.comp[componentClass], function(value, index) {
                        // check if control element still exists, otherwise clean up
                        if (is24c.lib.util.isBlank(value) || $(value.element).length === 0) {
                            is24c.comp[componentClass].splice(index, 1);
                        } else {
                            // check if still bound to DOM tree
                            if ($(value.element).closest('body').length === 0) {
                                value.destroy();
                                doSetup = true;
                            }
                            
                            // only reinit if component references are still valid
                            if (!doSetup) {
                                value.triggerReInit();
                            }
                        }
                    });
                }

                if (doSetup) {
                    is24c.lib.debug.log('DOM changed: component "' + componentClass + '" will be reinitialised', 'info');
                    is24c.lib.util.setupControl(componentClass, superClass, cssClassname, cssContext, true);
                }
            });
        },

        /**
         * register "images loaded" listener and trigger domChanged event
         */
        registerImagesLoadedEvent: function() {

            can.$(is24c.lib.util.constructor.defaults.cssContext).imagesLoaded()
                .always(function(instance) {
                    is24c.lib.debug.log('All images loaded', 'info');
                    is24c.lib.util.images.setLoaded(true);

                    is24c.lib.debug.log('DOM changed: Update triggered after all images have been loaded', 'info');
                    can.trigger(document, 'domChanged');
                })
                .done(function(instance) {
                    is24c.lib.debug.log('All images successfully loaded', 'info');
                })
                .fail(function() {
                    is24c.lib.debug.log('All images loaded, at least one is broken', 'info');
                })
                .progress(function(instance, image) {
                    var result = image.isLoaded ? 'loaded' : 'broken';
                    is24c.lib.debug.log( 'image is ' + result + ' for ' + image.img.src , 'info');
                });
        },

        /**
         * register "debounced resize" listener and trigger domChanged event
         */
        registerWindowDebouncedResizeEvent: function() {

            can.on.call(window, 'debouncedresize', function(ev, args) {
                can.trigger(document, 'domChanged');
            });
            
        },

        /**
         * register "orientation change" listener and trigger domChanged event
         */
        registerOrientationChangedEvent: function() {

            can.on.call(window, 'orientationchange', function(ev, args) {});
        }

    });

    // create new instance
    is24c.lib.event = new is24c.classes.lib.event();

});

/**
 * IS24 corporate website components
 *
 * @title           Publication List
 * @description     publication and press release list and filter
 * @namespace       is24c.comp.publicationList
 *
 * @author          Peter, Heimann
 * @version         2014.02.03
 */
$(function () {

    can.Control.extend('is24c.classes.comp.publicationList', {

        defaults: {
            css:{
                current: 'current',
                show: 'show'
            },
            itemsPerPage: 5,
            showFilter: false
        }

    }, {

        start: function (el) {
            this._var.indexOfItemToExpand = this.options.indexOfItemToExpand;

            // populate filter lists
            if (this.options.showFilter) {
                can.$.ajax({
                    dataType: 'html',
                    url: this.options.tagsURL,
                    success: can.proxy(function (data) {
                        if (data) {
                            var listHtml = '<li data-is24c-tagname="">' + this.options.loc.tagsDefaultEntry + '</li>' + data;
                            can.$('ul.publication-tags', this.element).html(listHtml).children('li').first().addClass(this.options.css.current);
                        }
                    }, this)
                });

                can.$.ajax({
                    dataType: "html",
                    url: this.options.categoriesURL,
                    success: can.proxy(function (data) {

                        if (data) {
                            var categoriesEl = can.$("ul.publication-categories", this.element);
                            categoriesEl.html(data);
                            var filterCategory = this.getSelectedCategory(categoriesEl);
                            filterCategory.addClass(this.options.css.current);
                            // set filter
                            this._var.categoryFilter = filterCategory.attr('data-is24c-categoryname');
                            this.reloadResults(true, this._var.indexOfItemToExpand);
                        }
                    }, this)
                });

            } else {
                this._var.categoryFilter = this.options.publicationsURL;
                this.reloadResults(true, this._var.indexOfItemToExpand);
            }
            
            // bind expander function to images ready event
            can.bind.call(document, 'imagesReady', can.proxy(function(ev, args) {
                if (this._var.indexOfItemToExpand) {
                    var releaseTitlesOfItems = can.$("div.publication-results", this.element).find('h3.release-title');

                    if (releaseTitlesOfItems.length > 0 && releaseTitlesOfItems.length > this._var.indexOfItemToExpand) {
                        this.expandElement(can.$(releaseTitlesOfItems[this._var.indexOfItemToExpand]));
                    }
                }
            }, this));
        },

        /**
         * @param {Object} categoriesEl - all category list items
         * @return {Object} - selected list item
         */
        getSelectedCategory: function (categoriesEl) {
            return can.$(this.options.preselectedCategory ? "li:contains(" + this.options.preselectedCategory + ")" : "li", categoriesEl).first(); 
        },

        /**
         * set states of a list item collection
         *  @param {Object} items - collection of (list items)
         *  @param {Object} currentItem - clicked list item
         */
        setItemState: function (items, currentItem) {
            // remove former current state
            items.filter('.' + this.options.css.current).addClass(this.options.css.show).removeClass(this.options.css.current);
            // make current
            currentItem.addClass(this.options.css.current).removeClass(this.options.css.show);
        },

        /**
         * set visibility of a list item collection
         *  @param {Object} items - collection of (list items)
         *  @param {Object} currentItem - clicked list item
         */
        toggleItems: function (items, currentItem) {
            items.closest('ul').toggleClass('open');
            items.not(currentItem).toggleClass(this.options.css.show);
        },

        /**
         * add event listener to tag filter
         * @param {Object} el - triggered element
         * @param {Object} ev - triggered event
         */
        'ul.publication-tags, ul.publication-categories click': function (el, ev) {
            is24c.lib.event.stop(ev);

            var items = el.children('li'),
                currentItem = items.filter('.' + this.options.css.current);

            this.toggleItems(items, currentItem);
        },

        /**
         * add event listener to tag filter
         * @param {Object} el - triggered element
         * @param {Object} ev - triggered event
         */
        'ul.publication-tags li click': function (el, ev) {
            if (!el.hasClass(this.options.css.current)) {
                is24c.lib.event.stop(ev);

                var items = el.closest('ul').children('li');
                this.setItemState(items, el);
                this.toggleItems(items, el);

                // trigger filter
                this._var.tagFilter = el.attr('data-is24c-tagname');
                this.reloadResults(true);
            }
        },

        /**
         * add event listener to category filter
         * @param {Object} el - triggered element
         * @param {Object} ev - triggered event
         */
        'ul.publication-categories li click': function (el, ev) {
            if (!el.hasClass(this.options.css.current)) {
                is24c.lib.event.stop(ev);

                var items = el.closest('ul').children('li');
                this.setItemState(items, el);
                this.toggleItems(items, el);

                // trigger filter
                this._var.categoryFilter = el.attr('data-is24c-categoryname');
                this.reloadResults(true);
            }
        },

        /**
         * add event listener to show more button
         * @param {Object} el - triggered element
         * @param {Object} ev - triggered event
         */
        '.showmore click': function (el, ev) {
            is24c.lib.event.stop(ev);

            this.reloadResults(false);
        },

        /**
         * add event listener to release title
         * @param {Object} triggeredElement - triggered element
         * @param {Object} event - triggered event
         */
        '.publication-results h3.release-title click': function (triggeredElement, event) {
            is24c.lib.event.stop(event);
            this.expandElement(triggeredElement);
        },

        /**
         * expand full press release
         * @param {Object} element - press release title
         */
        expandElement: function (element) {
            var article = element.closest('article'),
                wrapper = article.children('.wrapper'),
                completeList = article.closest('ul').find('article.' + this.options.css.show),
                newHeightOfArticle = 0;

            if (!article.hasClass(this.options.css.show)) {
                var text = article.find('.release-text');
                newHeightOfArticle = text.outerHeight(true);

                if (newHeightOfArticle > 0) {
                    article.addClass(this.options.css.show);
                    wrapper.transition( { 'height': newHeightOfArticle }, 500, 'ease', function () {
                        can.$(this).height(text.outerHeight(true));
                    });
                }
                completeList = completeList.not(article);
            }

            //close all currently expanded articles => set height to 0
            completeList.removeClass(this.options.css.show)
                .children('.wrapper')
                .transition({'height': 0 }, 500, 'ease');
            //all articles have now height 0
            
            // clear initial expand index 
            this._var.indexOfItemToExpand = null;
        },

        /**
         * load filter results
         * @param {Boolean} reset - flag to reload all results or append only
         * @param {Integer} indexOfItemToExpand - if set the result size will be expanded to include the item to display
         */
        reloadResults: function (reset, indexOfItemToExpand) {
            var pageSize = this.options.itemsPerPage;

            if (reset) {
                this._var.resultSize = 0;
                this._var.resultsShown = 0;
            }

            // build suffix
            var endIndex;
            if (indexOfItemToExpand) {
                //round down + 1
                var pageThatIncludesIndex = 1 + Math.round((indexOfItemToExpand / pageSize) - 0.49999);
                endIndex = pageThatIncludesIndex * pageSize;
            } else {
                endIndex = pageSize;
            }

            var suffix = "/" + this._var.resultsShown + "." + endIndex;
            if (!is24c.lib.util.isBlank(this._var.tagFilter)) {
                suffix += "." + this._var.tagFilter;
            }
            suffix += ".html";

            // check if categoryfilter contains parameter
            var url = '';
            this._var.params = window.encodeURI(window.location.search);
        
            if (this._var.params !== undefined) {
                this._var.categoryFilter = this._var.categoryFilter.split('?')[0];
                url = this._var.categoryFilter + suffix + this._var.params;
            } else {
                url = this._var.categoryFilter + suffix;
            }

            can.$.ajax({
                dataType: "html",
                url: url,
                success: can.proxy(function (data) {
                    if (data) {
                        var results = can.$("div.publication-results", this.element);

                        // hide "show more" button and empty results message
                        can.$(".showmore", this.element).remove();
                        results.children('p').remove();

                        if (reset) {
                            results.html(data);
                            this._var.resultSize = results.children('ul').attr('data-is24c-listsize');
                        } else {
                            results.append(data);
                        }

                        if (this._var.resultSize == 0) {
                            results.children('ul').remove();
                            results.append('<p>' + this.options.loc.noFilterResults + '</p>');
                        } else {
                            this._var.resultsShown += pageSize;
                            if (this._var.resultsShown < this._var.resultSize) {
                                results.append('<a href="#" class="ui-button cta showmore">' + this.options.loc.showMore + '</a>');
                            }
                            can.trigger(document, 'domChanged', 'image');

                            // check if the item to expand contains an image or not
                            // if not expand it directly, otherwise rely on imagesReady event 
                            if (this._var.indexOfItemToExpand) {
                                var releaseTitlesOfItems = can.$("div.publication-results", this.element).find('h3.release-title');
            
                                if (releaseTitlesOfItems.length > 0 && releaseTitlesOfItems.length > this._var.indexOfItemToExpand) {
                                    var headlineToExpand = can.$(releaseTitlesOfItems[this._var.indexOfItemToExpand]),
                                        article = headlineToExpand.closest('article');

                                    if (article.find('img').length == 0) {
                                        this.expandElement(headlineToExpand);
                                    }
                                    
                                }
                            }
                        }
                    }
                }, this)
            });
        }
    });

    // register new control
    is24c.lib.util.setupControl('publicationList', null, 'publication-list');

});

/**
 * IS24 corporate website components
 *
 * @title           TEASERLIST
 * @description     ...
 * @namespace       is24c.comp.teaserlist
 *
 * @author          Geier
 * @version         2014.01.30
 */

$(function() {

    can.Control.extend('is24c.classes.comp.teaserList', {

        defaults: { }

    }, {

        start: function() {
            this._var.busyClass     = 'busy';
            this._var.busyText      = 'Lade...'; /*TODO: I18n*/
            this._var.buttonNode    = can.$('a.load-more', this.element);
            this._var.resultsLoaded = false;
        },

        /**
         * "Load More" button handler.
         * @param {Object} el - control element
         * @param {Object} ev - event object
         * @return {}
         */
        '.load-more click': function (el, ev) {
            is24c.lib.event.stop(ev);

            var link = can.$(el);

            if(link.hasClass(this._var.busyClass))
                return;

            this.buttonIsBusy();

            $.ajax({
                dataType: "html",
                url: can.$(el).attr("href"),
                success: can.proxy(this.handleResponse, this)
            });
        },

        /**
         * Inject Ajax response into DOM.
         * @param {String} data - Ajax response
         * @return {}
         */
        handleResponse: function (data) {
            var c = this;

            if (data) {
                this.resetButton();
                this.element.html(data);
                can.trigger(document, 'domChanged', 'image');
            }
        },

        /*
        * Change button text & class during loading.
        * */
        buttonIsBusy: function () {
            var node = this._var.buttonNode;

            if(!node.data('text')) {
                node.data('text', node.text());
            }

            node.addClass(this._var.busyClass);
            node.text(this._var.busyText);
        },

        /*
         * Reset button text & class on Ajax loading finished.
         * */
        resetButton: function () {
            var node = this._var.buttonNode;

            node.text(node.data('text'));
            node.removeClass(this._var.busyClass);
        }
    });

    // register new control
    is24c.lib.util.setupControl('teaserList', null, 'teaserlist');
});

/**
 * IS24 corporate website components
 *
 * @title           TEASERCAROUSEL
 * @description     adds slideshow functionality to contact an d video teaser lists
 * @namespace       is24c.comp.teasercarousel
 *
 * @author          Geier
 * @version         2014.02.02
 */

$(function () {

    can.Control.extend('is24c.classes.comp.teasercarousel', {

        start: function () {
            this._setup();
        },

        reinit: function () {
            // react for resize and orientation changes
            this.checkOrientation();
        },

        /*
         * Decorate DOM with additional markup.
         * */
        _setup: function () {
            this._var.items = can.$('> .carousel-item', this.element);
            this._var.init = false;

            // wrap carousel items with slider, frame and frame-wrapper
            this._var.items.wrapAll('<div class="frame-wrapper"><div class="frame"><div class="slider"></div></div></div>');
            this._var.frame = can.$('.frame:first', this.element);
            this._var.slidee = can.$('.slider:first', this.element);
            this._var.currentPage = 1;

            this._doCalculations();
        },

        _doCalculations : function () {
            this._var.itemWidth = this._var.items.eq(0).outerWidth(true);

            // mobile only: li width and single item width
            if (is24c.lib.util.mqMatch.get('mobile')) {
                this._var.itemWidth = this._var.frame.width();
                this._var.items.width(this._var.frame.width());
            }

            this._var.showPerPage = Math.round(this._var.frame.width() / this._var.itemWidth);
            this._var.pages = Math.ceil(this._var.items.length / this._var.showPerPage);
            this._var.pageWidth = this._var.showPerPage * this._var.itemWidth;
            this._var.hasVideo = this._var.items.eq(0).find('.video').length > 0;
            // set item widths
            this._var.slidee.width(this._var.itemWidth * (this._var.items.length + 1));

            if (!this._var.init) {
                if (this._var.showPerPage < this._var.items.length) {
                    can.$('> .frame-wrapper', this.element)
                        .append('<div class="controls"><a class="prev"></a><a class="next"></a></div>');
                }

                // except for mobile: append player frame & capture youtube video clicks
                if (this._var.hasVideo && !is24c.lib.util.mqMatch.get('mobile')) {
                    can.$('> .frame-wrapper', this.element)
                        .after('<div class="player"><div class="inner"></div></div>');

                    this._var.items.find('.video-container').append('<div class="cover"></div>');
                }

                this._var.init = true;
            }
        },

        /*
         * Recalculates DOM elements and internals.
         */
        checkOrientation: function () {
            this._doCalculations();
            this._slideToPage(this._var.currentPage);
        },

        /*
         * Bind UI handlers.
         */
        '.cover click'  : function (el, ev) {
            var playerNode = $('.player .inner', this.element),
                iframeNode = el.parent().find('iframe').clone();

            // append auto-play param to original URL
            iframeNode.attr('src', iframeNode.attr('src') + '&autoplay=1');

            // slide of not yet opened
            if (!playerNode.hasClass('open')) {
                is24c.lib.util.collapsible.slideToggle(ev, playerNode, playerNode, function () {
                    playerNode.html(iframeNode);
                });
            } else {
                playerNode.html(iframeNode);
            }
        },

        _firstPage: function () {
            this._var.currentPage = 1;
            this._slideToPage(this._var.currentPage);
        },

        _lastPage: function () {
            this._var.currentPage = this._var.pages;
            this._slideToPage(this._var.currentPage);
        },

        _nextPage: function () {
            if (this._var.currentPage == this._var.pages) {
                this._firstPage();
            } else {
                this._slideToPage(++this._var.currentPage);
            }
        },

        _prevPage: function () {
            if (this._var.currentPage == 1) {
                this._lastPage();
            } else {
                this._slideToPage(--this._var.currentPage);
            }
        },

        _slideToPage: function (page) {
            var xOffset = --page * this._var.pageWidth;

            if(is24c.lib.util.isBrowser(['ie8', 'ie9'])) {
                this._var.slidee.animate({
                    left: -xOffset
                }, 1000, 'swing')
            } else {
                this._var.slidee.transition({
                    translate: [-xOffset, 0]
                });
            }
        },

        '.next click': function (el, ev) {
            is24c.lib.event.stop(ev);
            this._nextPage();
        },

        '.prev click': function (el, ev) {
            is24c.lib.event.stop(ev);
            this._prevPage();
        }
    });

    // register new control
    is24c.lib.util.setupControl('teasercarousel');

    // register dom changed event
    is24c.lib.event.registerDomChangedEvent('teasercarousel');

});

/**
 * IS24 corporate website components
 * 
 * @title           TEASER
 * @description     basic text & image teaser
 * @namespace       is24c.comp.teaserBasic
 * 
 * @author          Heimann
 * @version         2014.01.14
 */

$(function() {

    can.Control.extend('is24c.classes.comp.teaserBasic', {

        defaults: {
            isEmptyClass : 'teaser-empty'
        }

    }, {

        start: function() {
            this.isEmpty();
        },

        isEmpty: function () {
            var element = can.$(this.element);
            element.toggleClass(this.options.isEmptyClass, !(element.height() > 10));

        }

    });

    // register new control
    is24c.lib.util.setupControl('teaserBasic', null, 'teaser-basic');

});

/**
 * IS24 corporate website components
 * 
 * @title           SUBSTAGE
 * @description     add some offset calculation for nicer layout
 * @namespace       is24c.comp.substage
 * 
 * @author          Heimann
 * @version         2014.02.21
 */

$(function() {

    can.Control.extend('is24c.classes.comp.substage', {

        reinit: function() {
            this.init();
        },

        start: function() {
            if (!is24c.lib.util.mqMatch.get('mobile')) {
                this.calculateOffset();
            } else {
                this.calculateOffset('0px');
            }
        },
        
        /**
         * calculate horizontal offset and adjust substage accordingly
         */
        calculateOffset: function(offset) {

            var parsys = this.element.closest('.parsys');
                offset = offset || -parsys.offset().left + 'px';

            this.element.css({
                'margin-left': offset,
                'margin-right': offset
            });
        }

    });

    // register new control
    is24c.lib.util.setupControl('substage');

    // register dom changed event
    is24c.lib.event.registerDomChangedEvent('substage');

});

/**
 * IS24 corporate website components
 * 
 * @title           SLIDE
 * @description     text positioning inside stage slide
 * @namespace       is24c.comp.slide
 * 
 * @author          Heimann, Geier
 * @version         2014.01.22
 */

$(function() {

    can.Control.extend('is24c.classes.comp.slide', {

        start: function() {
            this.setHeight();
        },
        
        /**
         * set height of figure and image
         */
        setHeight: function() {
            var stage = this.element.closest('.stage');
            
            // only proceed if stage has correct height
            if (stage.hasClass('resized')) {
                var stageHeight = stage.height(),
                    figure = can.$('figure', this.element),
                    image = can.$('img', figure);

                // set figure and stage content height
                figure.height(stageHeight);

                // only act if image has been requested by foresight script 
                if (!figure.hasClass('loading')) {
                    // 'auto' image dimensions for calculation
                    this.setImageProps(image, 'auto', 'auto');
    
                    var calculations,
                        calculationInterval,
                        maxIterations = 10,
                        iterations = 0;

                    // check if both image dimensions are > 0
                    calculationInterval = window.setInterval(can.proxy(function() {
                            // get dimensions
                            calculations = this.getCalculations(figure, image);
                            iterations++;

                            // stop interval if dimensions are valid or after maxIterations
                            if (!is24c.lib.util.isBlank(calculations) || iterations >= maxIterations) {
                                window.clearInterval(calculationInterval);
                                applyDimensions(this);
                            }
                        }, this), 100);
    
                    function applyDimensions(slide) {
                        if (iterations < maxIterations) {
                            if (calculations.height.ratio > calculations.width.ratio) {
                                // only set height first 
                                image.css('height', '100%');
                                // recalculate width
                                calculations = slide.getCalculations(figure, image);
                                slide.setImageProps(image, '100%', 'auto', calculations.width.diff / 2, 0);
                            } else {
                                // only set width first 
                                image.css('width', '100%');
                                // recalculate height
                                calculations = slide.getCalculations(figure, image);
                                slide.setImageProps(image, 'auto', '100%', 0, calculations.height.diff / 2);
                            }

                            // show image
                            image.transition({
                                opacity: 1
                            }, 500, 'ease');
                        }
                    } 
                }
            }
        },
        
        /**
         * set image css properties
         * @param {Object} obj - image object
         * @param {String} height - image height
         * @param {String} width - image width
         * @param {Int} marginLeft - image marginLeft
         * @param {Int} marginTop - image marginTop
         * @param {Int} opacity - image opacity
         * @return {Object} - object with calculated width and height
         */
        setImageProps: function(obj, height, width, marginLeft, marginTop, opacity) {
            obj.css({
                'height': height,
                'margin-left': marginLeft ? -Math.round(Math.abs(marginLeft)) : 0,
                'margin-top': marginTop ? -Math.round(Math.abs(marginTop)) : 0,
                'opacity': opacity ? opacity : 0,
                'width': width
            });
        },

        /**
         * get dimensions (figure, image)
         * @param {Object} obj - figure or image object
         * @return {Object} - object with calculated width and height
         */
        getDimensions: function(obj) {
            return {
                height: obj.height(),
                width: obj.width()
            };
        },

        /**
         * get dimension differences (figure, image)
         * @param {Object} figure - figure object
         * @param {Object} img - image object
         * @return {Object} - object with calculated width and height differences and ratios
         */
        getCalculations: function(figure, image) {
            var figureDims = this.getDimensions(figure),
                imageDims = this.getDimensions(image);
                
            return (imageDims.height > 0 && imageDims.width > 0) ? {
                    height: { 
                        diff: imageDims.height - figureDims.height,
                        ratio: figureDims.height / imageDims.height
                    },
                    width: {
                        diff: imageDims.width - figureDims.width,
                        ratio: figureDims.width / imageDims.width
                    }
            } : {};
        }

    });

    // register new control
    is24c.lib.util.setupControl('slide');

});

/**
 * IS24 corporate website components
 *
 * @title           STAGE
 * @description     setup rotating stage components
 * @namespace       is24c.comp.stage
 *
 * @author          Heimann
 * @version         2014.01.14
 */

/*TODO
*    revert to video thumb on navigation click while video is playing
*   progressbar, responsive
*
* */

$(function() {

    can.Control.extend('is24c.classes.comp.stage', {

        defaults: {
            css: {
                current: 'current'
            },
            youtubeApiLoaded: false,
            pendingFunctions: [],
            videoControls: {},
            currentVideoPlaying: 0,
            lastVideoPlayed: 0,
            currentPage: 1,
            lastYTPlayerState: -1
        }

    }, {
        reinit: function () {
            this.init();
            this._doCalculations();
            this._slideToPage(this.options.currentPage);
        },

        start: function() {
            var context = this;

            // initial vars
            this._var.frame         = can.$(this.element);
            this._var.slidee        = can.$('.slider', this.element);
            this._var.items         = can.$('.slide', this.element);

            this._var.items.find('.video').closest('.slide').remove();

            this._var.controls = {
                prev: can.$('.prev', this.element),
                next: can.$('.next', this.element)
            };

            // only add if mobile mq is not active
            if (!is24c.lib.util.mqMatch.get('mobile')) {
                this.createJumpLink();

                // trigger inner slide recalculation
                var slides = is24c.comp.slide;

                if (slides.length > 0) {
                    // only process if there are slides
                    this.setHeight();

                    for (var i=0; i < slides.length; i++) {
                        slides[i].init();
                    }
                }
            } else {
                this.element.height('auto');
                this._var.items.height('auto');
                this._var.items.find('figure').height('auto');
            }

            this._doCalculations();

            if(this._var.items.length > 1 && is24c.lib.util.mqMatch.get('desktop')) {
                this._startRotationInterval();
            }

            if(!is24c.lib.util.mqMatch.get('desktop')) {
                this._initAlternativeNavigation();
            }
        },

        _initAlternativeNavigation: function () {
            this._buildAlternativeNavigation();
            this._bindSwipeTapEvents();
        },

        _buildAlternativeNavigation: function () {
            var context = this;

            can.$('.slide-indicator', this.element).remove();

            var node = can.$('<div class="slide-indicator controls"></div>');
            can.each(can.makeArray(this._var.items), function(obj) {
                var dotNode = can.$('<div class="dot"></div>');
                node.append(dotNode);
            })

            node.insertBefore(this._var.slidee);
            node.css('margin-left', -(node.outerWidth(true) / 2));
        },

        _updateAlternativeNavigation: function (currentIndex) {
            currentIndex = currentIndex || this.options.currentPage;

            can.$('.slide-indicator', this.element)
                .find('.dot').removeClass('current').eq(parseInt(currentIndex) - 1).addClass('current');
        },

        _bindSwipeTapEvents: function () {
            var context = this;

            this._var.items.swipe({
                excludedElements: "button, input, select, textarea, .noSwipe",
                swipeLeft    : function () { context._nextPage() },
                swipeRight   : function () { context._prevPage() },
                threshold: 30
            });

            this._var.items.find('> a').swipe({
                excludedElements: "button, input, select, textarea, .noSwipe",
                tap: function () {
                    window.location = can.$(this).attr('href');
                },
                threshold: 30
            });
        },

        /**
         * Calculates widths of DOM elements to allow sliding.
         * @return {}
         */
        _doCalculations: function () {
            this._var.frameWidth    = this._var.frame.width();
            this._var.itemWidth     = this._var.frameWidth;
            this._var.pages         = this._var.items.length;
            this._var.pageWidth     = this._var.itemWidth;

            // grow ul to actual size
            this._var.slidee.width(this._var.pageWidth * this._var.pages);
            this._var.items.width(this._var.frameWidth);
        },

        _startRotationInterval: function () {
            this._stopRotationInterval();

            // hide progressbar in authormode; temp fix
            var pageComponent = is24c.lib.util.getConfig('body');
            if(pageComponent.authorMode == false) {
                this._buildProgressBar();
                this._startProgressBar();
            }

            var context = this,
                nextPageFunc = function () {
                    context._nextPage();
                    context._restartProgressBar();
                }

            this.options.rotation.interval = setInterval(can.proxy(nextPageFunc, context), this.options.rotation.rotationTime);
        },

        _stopRotationInterval: function () {
            if(this.options.rotation.interval) {
                clearInterval(this.options.rotation.interval);
            }
        },

        _buildProgressBar: function () {
            var progressIndicator = can.$(this.element).find('.progress-indicator');
            if(progressIndicator.length == 0) {
                can.$(this.element).append('<div class="progress-indicator"></div>');
                progressIndicator = can.$(this.element).find('.progress-indicator');
            }
        },

        _startProgressBar: function () {
            var progressIndicator = can.$(this.element).find('.progress-indicator'),
                context = this;

            progressIndicator.empty();
            progressIndicator.append('<div class="bar"></div>');

            progressIndicator.find('.bar').transition({
                width: '100%',
                duration: context.options.rotation.rotationTime,
                easing: 'linear'
            })
        },

        _resetProgressBar: function () {
            var progressIndicator = can.$(this.element).find('.progress-indicator');
            progressIndicator.empty();
        },

        _restartProgressBar: function () {
            this._resetProgressBar();
            this._startProgressBar();
        },

        _removeProgressBar: function () {
            this._stopRotationInterval();

            var progressIndicator = can.$(this.element).find('.progress-indicator');
            progressIndicator.transition({
                opacity: 0,
                duration: 300
            })
        },

        /**
         * set height of stage according to viewport size
         */
        setHeight: function() {
            // get height of viewport - header height
            var headerHeight = can.$('#header').outerHeight(true),
                windowHeight = can.$(window).height(),
                stageHeight = windowHeight - headerHeight;

            this.element.height(stageHeight).addClass('resized');
            this._var.items.height(stageHeight);
        },

        /**
         * create a link to jump to the bottom of the stage
         */
        createJumpLink: function() {
            if (this.element.children('.button').length == 0) {
                this.element.append('<span class="button"/>');
            }
        },

        _firstPage: function () {
            this.options.currentPage = 1;
            this._slideToPage(this.options.currentPage);
        },

        _lastPage: function () {
            this.options.currentPage = this._var.pages;
            this._slideToPage(this.options.currentPage);
        },

        _nextPage: function () {
            if(this.options.currentPage == this._var.pages) {
                this._firstPage();
            } else {
                this._slideToPage(++this.options.currentPage);
            }
        },

        _prevPage: function () {
            if(this.options.currentPage == 1) {
                this._lastPage();
            } else {
                this._slideToPage(--this.options.currentPage);
            }
        },

        /**
         * Simple throttling of the scroll event
         * @param {int} page - page number starting with 1
         * @return {}
         */
        _slideToPage: function (page) {
            var context = this;
            this.options.currentPage = page;

            if (!is24c.lib.util.mqMatch.get('mobile')) {
                //this._handleControls(page);
            }

            var xOffset = --page * this._var.pageWidth;
            if(is24c.lib.util.isBrowser(['ie8', 'ie9'])) {
                this._var.slidee.animate({
                    left: -xOffset
                }, 1000, 'swing', function (){
                    context._updateAlternativeNavigation();
                })
            } else {
                this._var.slidee.transition({
                        translate: [-xOffset, 0],
                        duration:   1000,
                        easing:     'ease'
                    }
                    , function () {
                    context._updateAlternativeNavigation();
                });
            }
        },

        /**
         * add event to button
         * @param {Object} el - control element
         * @param {Object} ev - event object
         */
        '> .button click': function(el, ev) {
            is24c.lib.event.stop(ev);

            can.$('#content').animatescroll({
                scrollSpeed: 1000,
                easing: 'easeInOutSine'
            });
        },

        '.next click': function (el, ev) {
            is24c.lib.event.stop(ev);

            this._removeProgressBar();
            this._nextPage();
        },

        '.prev click' :function (el, ev) {
            is24c.lib.event.stop(ev);

            this._removeProgressBar();
            this._prevPage();
        }
    });

    // register new control
    is24c.lib.util.setupControl('stage');

    // register dom changed event
    is24c.lib.event.registerDomChangedEvent('stage');

});

/**
 * IS24 corporate website components
 * 
 * @title           SOCIALTEASERCAROUSEL
 * @description     Display teaser form various channels
 * @namespace       is24c.comp.socialteasercarousel
 * 
 * @author          Geier
 * @version         2014.02.02
 */

$(function() {

    can.Control.extend('is24c.classes.comp.socialteasercarousel', {
        
        defaults: { }

    }, {

        reinit: function() {
            // react for resize and orientation changes
            this._doCalculations();
            this._slideToPage(this._var.currentPage);
        },

        start: function() {

            // setting internals
            this._var.frame         = can.$('.frame', this.element);
            this._var.slidee        = can.$('.slider', this.element);
            this._var.items         = can.$('.item', this.element);
            this._var.currentPage   = 1;

            this._bindUI();
            this._doCalculations();
            this._highlightTwitterUrls();
        },

        _bindUI: function () {
            // remove arrows from first and last element
            this._var.items.filter(':first').find('.prev').remove();
            this._var.items.filter(':last').find('.next').remove();
        },

        _doCalculations: function () {
            this._var.frameWidth    = this._var.frame.width();

            // set special for mobile: item width
            if (is24c.lib.util.mqMatch.get('mobile')) {
                this._var.itemWidth   = this._var.frameWidth;
                this._var.showPerPage = 1;

                // hide other all list items but the first
                this._var.items.each(function() {
                    can.$('li', this).not(':first').hide();
                });
            } else {
                this._var.itemWidth   = this._var.items.eq(0).find('li').eq(0).outerWidth(true);
                this._var.showPerPage = Math.round(this._var.frameWidth / this._var.itemWidth);

                this._var.items.each(function() {
                    can.$('li', this).not(':first').show();
                });
            }

            this._var.pages         = this._var.items.length;
            this._var.pageWidth     = this._var.showPerPage * this._var.itemWidth;

            // grow ul to actual size
            this._var.slidee.width(this._var.pageWidth * this._var.pages);
            this._var.items.width(this._var.pageWidth);
        },

        /*
         * Make twitter URLs real links (experimental).
         */
        _highlightTwitterUrls: function () {

            //split
            $.each(can.$(this.element).find('.twitter .summary'), function (index, value) {
                var split = can.$(value).html().split(" "),
                    str;

                for (var i in split) {
                    str = split[i];

                     // regex could be improved
                    if (str.match(/^http/gi)) {
                        // match links
                        split[i] = '<a href="' + str + '" target="_blank">' + str + '</a>';
                    } else if (str.match(/^@/gi)) {
                        // match profiles
                        split[i] = '<span class="twitter-profile">' + str + '</span>';
                    } else if (str.match(/^#/gi)) {
                        // match hashtags
                        split[i] = '<span class="twitter-hash">' + str + '</span>';
                    }
                }

                // merge back together
                can.$(value).html(split.join(" "));
            });
        },


        _firstPage: function () {
            this._var.currentPage = 1;
            this._slideToPage(this._var.currentPage);
        },

        _lastPage: function () {
            this._var.currentPage = this._var.pages;
            this._slideToPage(this._var.currentPage);
        },

        _nextPage: function () {
            if(this._var.currentPage == this._var.pages) {
                this._firstPage();
            } else {
                this._slideToPage(++this._var.currentPage);
            }
        },

        _prevPage: function () {
            if(this._var.currentPage == 1) {
                this._lastPage();
            } else {
                this._slideToPage(--this._var.currentPage);
            }
        },

        _slideToPage: function (page) {
            var xOffset = --page * this._var.pageWidth;

            if(is24c.lib.util.isBrowser(['ie8', 'ie9'])) {
                this._var.slidee.animate({
                    left: -xOffset
                }, 1000, 'swing')
            } else {
                this._var.slidee.transition({
                    translate: [-xOffset, 0]
                });
            }

        },

        '.next click': function (el, ev) {
            is24c.lib.event.stop(ev);
            this._nextPage();
        },

        '.prev click' :function (el, ev) {
            is24c.lib.event.stop(ev);
            this._prevPage();
        }
    });

    // register new control
    is24c.lib.util.setupControl('socialteasercarousel');

    // register dom changed event
    is24c.lib.event.registerDomChangedEvent('socialteasercarousel');

});

/**
 * IS24 corporate website components
 * 
 * @title           SEARCH_RESULTS
 * @description     ...
 * @namespace       is24c.comp.searchResults
 * 
 * @author          Heimann
 * @version         2014.02.12
 */

$(function() {

    can.Control.extend('is24c.classes.comp.searchResults', {
        
        defaults: {
            css: {
                loading: 'icon-spinner-b'
            },
            text: {
                loading: 'Lade weitere Ergebnisse'
            }
        }

    }, {

        start: function() {
            this._var.buttonNode = can.$('a.cta', this.element);
            this._var.bodyNode   = can.$('.results-body', this.element);
            this._var.listNode   = can.$('#complete-result-list', this.element);

            this.fixLinkParserBug();
            this.fixLinkAnchors();
        },

        /**
         * "Show More" button handler.
         * @param {Object} el - control element
         * @param {Object} ev - event object
         * @return {}
         */
        'a.cta click': function (el, ev) {
            is24c.lib.event.stop(ev);

            if (el.hasClass(this.options.css.loading)) {
                return;
            } else {
                this.buttonIsBusy();
                
                if (is24c.lib.util.isBlank(this._var.url)) {
                    this._var.url = window.location.protocol + '//' + window.location.host + window.location.pathname;
                    this._var.params = window.encodeURI(window.location.search);
                
                    if (this._var.params !== undefined) {
                        this._var.params = can.deparam(this._var.params.substring(1, this._var.params.length));
                    }
                }
    
                if (!is24c.lib.util.isBlank(this._var.params) && !is24c.lib.util.isBlank(this._var.params.q)) {
                    // skip all other (possible) params
                    // + determine start position (length of list)
                    this._var.params = {
                        q: this._var.params.q,
                        start: can.$('ul li.cluster li', this.element).length
                    };
                    
                    can.ajax({
                        dataType: "html",
                        url: this._var.url + '?' + can.param(this._var.params),
                        success: can.proxy(this.handleResponse, this)
                    });
                }
            }
        },

        /**
         * Inject Ajax response into DOM.
         * @param {String} data - Ajax response
         * @return {}
         */
        handleResponse: function (data) {
            // fix height of list
            this.setBodyHeight(this.getListHeight());
            var dataObject =  can.$(data);
            if (dataObject) {
                var newResults = dataObject.find('.search-results ul li.cluster');
                if(newResults && newResults.length>0){
                    // append new results
                    for (var i = 0; i < newResults.length; i++) {
                        var cluster =  can.$(newResults[i]);
                        if (i == 0){
                            var exitingCluster = this._var.listNode.find("#"+cluster.attr('id'));
                            if(exitingCluster && exitingCluster.length>0){
                                exitingCluster.find('ul').append(cluster.find('li'));
                            } else{
                                this._var.listNode.append(cluster);
                            }
                        }  else{
                            // cluster can not exist on page
                            this._var.listNode.append(cluster);
                        }
                    }
                }
            }

            // remove fix list height
            this.setBodyHeight(this.getListHeight());
            this._var.bodyNode.on('transitionend mozTransitionEnd msTransitionEnd oTransitionEnd webkitTransitionEnd', can.proxy(function() {
                this.setBodyHeight('auto');
                this.fixLinkParserBug();
            }, this));

            // hide button if needed
            dataObject.find('#hasMoreResults').length > 0 ? this.resetButton() : this.removeButton();
        },

        /**
         * Change button text & class during loading.
         */
        buttonIsBusy: function () {
            var node = this._var.buttonNode;

            if (!node.data('text')) {
                node.data('text', node.text());
            }

            node.addClass(this.options.css.loading).text(this.options.text.loading);
        },

        /**
         * Remove button from DOM
         */
        removeButton: function () {
            this._var.buttonNode.remove();
        },

        /**
         * Reset button text & class on Ajax loading finished.
         */
        resetButton: function () {
            var node = this._var.buttonNode;

            node.text(node.data('text')).removeClass(this.options.css.loading);
        },

        /**
         * get height of current search results list
         * @return {Integer} - height of list
         */
        getListHeight: function() {
            return this._var.listNode.outerHeight(true);
        },
        
        /**
         * set height of current search results list
         * @param {Integer} - new height of list
         */
        setBodyHeight: function(newHeight) {
            this._var.bodyNode.height(newHeight);
        },
        
        /**
         * fix broken links rendered from CQ linkchecker (product bug)
         */
        fixLinkParserBug: function() {
            var text = can.$('li p', this._var.listNode),
                html, found, parts;

            text.each(function() {
                html = can.$(this).html(),
                found = html.match(/ahref/gi);
                
                if (!is24c.lib.util.isBlank(found)) {
                    parts = html.split('<a');
                    parts[parts.length - 1] = '<a ' + parts[parts.length - 1] + '</a>';
                    can.$(this).html(parts.join(' '));
                }
            });
        },
        
        /**
         * fix "google ajax anchors"
         */
        fixLinkAnchors: function() {
            var links = can.$('li p a', this._var.listNode),
                href, anchor, parts;

            links.each(function() {
                href = can.$(this).attr('href'),
                parts = href.split('#');
                
                if (parts.length > 1 ) {
                    anchor = parts[parts.length - 1];
                    if (anchor.indexOf('!') != -1) {
                        parts[parts.length - 1] = anchor.substring(1, anchor.length);
                    }
                    can.$(this).attr('href', parts.join('#'));
                }
            });
        }
        
    });

    // register new control
    is24c.lib.util.setupControl('searchResults', null, 'search-results');

});

/**
 * IS24 corporate website components
 * 
 * @title           SEARCH_INPUT
 * @description     add open/close functionality to search input
 * @namespace       is24c.comp.searchInput
 * 
 * @author          Heimann
 * @version         2014.01.14
 */

$(function() {

    can.Control.extend('is24c.classes.comp.searchInput', {
        
        defaults: {
            css: {
                icon: 'icon-cancel-a'
            },
            inputField: '#search-term',
            minCharacters: 3
        }

    }, {

        start: function(el) {
            // only act, if search input is located in page header
            if (this.element.closest('#header').length > 0) {
                this.createResetIcon();
    
                // only trigger if mobile mq is active
                if (is24c.lib.util.mqMatch.get('mobile')) {
                    can.$(this.options.inputField).trigger('keyup');
                }
            }
        },

        /**
         * add element to reset (empty) text input field
         */
        createResetIcon: function() {
            this.element.children('form').append('<span class="' + this.options.css.icon + ' hd" />');
        },

        /**
         * show reset icon
         */
        showResetIcon: function() {
            can.$('.' + this.options.css.icon, this.element).removeClass('hd');
        },

        /**
         * hide reset icon
         */
        hideResetIcon: function() {
            can.$('.' + this.options.css.icon, this.element).addClass('hd');
        },

        /**
         * Attach click handler to label, to toggle visibility of input field
         * @param {Object} el - control element
         * @param {Object} ev - event object
         */
        'label click': function (el, ev) {
            is24c.lib.event.stop(ev);

            var input = can.$(this.options.inputField);
            
            input.slideToggle({
                start: can.proxy(this.hideResetIcon, this),
                complete: can.proxy(function() {
                    if (input.css('display') != 'none' && input.val().length > this.options.minCharacters) {
                        this.showResetIcon();
                    }
                }, this)
            });
        },
        
        /**
         * Attach click handler to reset icon, to empty text field
         * @param {Object} el - control element
         * @param {Object} ev - event object
         */
        'span.{css.icon} click': function (el, ev) {
            is24c.lib.event.stop(ev);

            // empty field
            can.$(this.options.inputField).val('');
            // hide itself
            this.hideResetIcon();
        },
        
        /**
         * Attach key listener to input text field
         * @param {Object} el - control element
         * @param {Object} ev - event object
         */
        'input[type="text"] keyup': function (el, ev) {
            if (this.element.closest('#header').length > 0) {
                el.val().length > this.options.minCharacters ? this.showResetIcon() : this.hideResetIcon();
            }
        },
        
        /**
         * Attach click handler to text field
         * @param {Object} el - control element
         * @param {Object} ev - event object
         */
        'input[type="text"] click': function (el, ev) {
            is24c.lib.event.stop(ev);
        },
        
        /**
         * Attach click handler to form for submit
         * @param {Object} el - control element
         * @param {Object} ev - event object
         */
        'form click': function (el, ev) {
            is24c.lib.event.stop(ev);

            el.submit();
        }
        
    });

    // register new control
    is24c.lib.util.setupControl('searchInput', null, 'search-input');

});

/**
 * IS24 corporate website components
 * 
 * @title           PRESS TEASER
 * @description     truncation for current press release teaser on homepage
 * @namespace       is24c.comp.pressTeaser
 * 
 * @author          Peter, Heimann
 * @version         2014.01.31
 */
$(function() {

    can.Control.extend('is24c.classes.comp.pressteaser', {

            defaults: {
                ellipsis: '[\u2026]', 
                truncationLength: 1000
            }

    }, {

        start: function(el) {
            var ellipsis = this.options.ellipsis,
                length = this.options.truncationLength;

            // half truncation length on mobile
            if (is24c.lib.util.mqMatch.get('mobile')) {
                length *= 0.5;
            }

            $("li .parsys", this.element).each(function() {
                $(this).truncate({
                    ellipsis: ellipsis,
                    length: length
                });
            });
        }

    });

    // register new control
    is24c.lib.util.setupControl('pressteaser');

});

/**
 * IS24 corporate website components
 * 
 * @title           PANEL
 * @description     toggle open/close state of panel body
 * @namespace       is24c.comp.panel
 * 
 * @author          Heimann
 * @version         2014.02.05
 */
$(function() {

    can.Control.extend('is24c.classes.comp.panel', {
        
        defaults: {
            enableToggle: false,
            css: {
                closed: 'closed',
                toggle: 'toggle'
            }
        }

    }, {

        start: function(el) {
            this._var.header = can.$('> header', this.element);
            this._var.panelBody = can.$('> .panel-body', this.element);
            this._var.parsys = this._var.panelBody.children('.parsys');

            if (this.options.enableToggle || is24c.lib.util.mqMatch.get('mobile')) {
                this._var.header.addClass(this.options.css.toggle);

                if (is24c.lib.util.mqMatch.get('mobile')) {
                    this._var.header.addClass(this.options.css.closed);
                    this._var.panelBody.addClass(this.options.css.closed);
                }

                this._var.authorMode = is24c.lib.util.isBlank(is24c.lib.util.getConfig('body')) ? false : is24c.lib.util.getConfig('body').authorMode;
                
                if (!this._var.authorMode && is24c.lib.util.images.getLoaded()) {
                    if (this._var.panelBody.hasClass(this.options.css.closed)) {
                        this._var.parsys.css('margin-top', -this.getParsysHeight());
                    }
                }
            } else {
                this._var.header.removeClass(this.options.css.toggle);
            }

            if (is24c.lib.util.mqMatch.get('mobile')) {
                this.considerVacanciesParam();
            }
        },

        /**
         * will be triggered, if domChanged event was fired
         * recalculate hidden contents on non-desktop devices
         */
        reinit: function() {
            if (this._var.panelBody.hasClass(this.options.css.closed) && !is24c.lib.util.mqMatch.get('desktop')) {
                this._var.parsys.css('margin-top', -this.getParsysHeight());
            }
        },

        /**
         * get height of panel parsys
         * @return {Int} - height of panel incl. padding and border
         */
        getParsysHeight: function() {
            return this._var.parsys.outerHeight();
        },

        /**
         * Attach click handler to panel header
         * @param {Object} el - control element
         * @param {Object} ev - event object
         * @return {}
         */
        '> header click': function (el, ev) {
            is24c.lib.event.stop(ev);

            if ((this.options.enableToggle || is24c.lib.util.mqMatch.get('mobile')) && !this._var.authorMode) {
                this._var.panelBody.addClass('in-progress');
                this._var.parsys.transition({
                    marginTop: parseInt(this._var.parsys.css('margin-top')) >= 0 ? -this.getParsysHeight() : 0
                }, can.proxy(function() {
                    el.toggleClass(this.options.css.closed);
                    this._var.panelBody.removeClass('in-progress').toggleClass(this.options.css.closed);
                }, this));
            }
        },

        /**
         * Check if the panel houses a vacancies list and if it contains a specific item; if so, expand the panel.
         * @return {}
         */
        considerVacanciesParam: function () {
            var jobId       = window.encodeURI(window.location.hash.substring(1, window.location.hash.length)),
                liItem      = can.$('[data-id="' + jobId + '"]', this.element);

            if(liItem.length > 0) {
                can.$('header', this.element).trigger('click');
            }
        }
    });

    // register new control
    is24c.lib.util.setupControl('panel');

    // register dom changed event
    if(!is24c.lib.util.mqMatch.get('desktop')) {
        is24c.lib.event.registerDomChangedEvent('panel');
    }
});

/**
 * IS24 corporate website components
 * 
 * @title           PAGE
 * @description     register menu toggle
 *                  fix parsys problem with ghosts
 * @namespace       is24c.comp.page
 * 
 * @author          Heimann
 * @version         2014.01.14
 */

$(function() {

    can.Control.extend('is24c.classes.comp.page', {
        
        defaults: {
            parallaxFactor: 2 // smaller = faster
        }

    },{

        /**
         * will be triggered, if domChanged event was fired
         */
        reinit: function() {
            this.init();
        },
        
        start: function() {
            // clean up CQ parsys flaws
            if (!this.options.authorMode) {
                this.cleanParsys();
            }
            
            // register empty event listener on #header to trigger
            // iPhone Safari to realize the event listener on menu (below)!
            //
            // Totally weired - don't know why this is necessary
            if (is24c.lib.util.mqMatch.get('mobile')) {
                can.$('#header').on('click', function() {});
            }
            
            // add parallax scrolling (but not on mobile)
            if (!is24c.lib.util.mqMatch.get('mobile')) {
                this.initiateParallaxScrolling();
            }
        },

        /**
         * register click toggle for menu (search, main-nav)
         * @param {Object} el - element being clicked
         * @param {Event} ev - event triggered
         */
        '#header .menu click': function(el, ev) {
            var wrapper = can.$('#header .wrapper-nav'),
                height = 0;
                
            // get summarized height of all children
            wrapper.children().filter(':visible').each(function() {
                height += can.$(this).outerHeight(true);
            });

            el.toggleClass('open');
            wrapper.toggleClass('open').transition({
                height: el.hasClass('open') ? height + 'px' : '0'
            });
        },

        /**
         * temporary fix(!)
         * remove DOM fragments, which are not properly cleaned up by CQ
         * currently narrowed to ghosts in content parsys
         */
        cleanParsys: function() {
            can.$('#content .parsys .ghost').remove();
        },


        /**
         * initially position section page images
         */
        initiateParallaxScrolling: function() {
            var images = can.$('.sectionpage > .wrapper > .image', this.element),
                figure;
            this._var.images = [];
            
            images.each(can.proxy(function(index, el) {
                figure = can.$(el);

                this._var.images[index] = {
                    figure: figure,
                    figureHeight: figure.height(),
                    img: can.$('img', figure)
                };
            }, this));
        },

        /**
         * add parallax scrolling behaviour on window scroll to sectionpage images
         * @param {Object} el - control element
         * @param {Object} ev - event object
         * @return {}
         */
        '{window} scroll': function (el, ev) {
            if (!is24c.lib.util.isBlank(this._var.images) && !is24c.lib.util.mqMatch.get('mobile')) {
                // determine positions
                var scrollPos = can.$(window).scrollTop(),
                    speed = scrollPos - (this._var.scrollPos ? this._var.scrollPos : scrollPos),
                    viewport = {
                        min: scrollPos,
                        max: scrollPos + can.$(window).height()
                    },
                    image, posY, maxPosY, offsetTop, offsetBottom;
    
                // store current scroll position
                this._var.scrollPos = scrollPos;
                
                for (var i=0; i < this._var.images.length; i++) {
                    image = this._var.images[i],
                    offsetTop = parseInt(image.figure.offset().top),
                    offsetBottom = parseInt(offsetTop + image.figureHeight);
    
                    // determine height of image if not already done
                    if (is24c.lib.util.isBlank(image.imgHeight)) {
                        image.imgHeight = image.img.height();
                    }

                    // check if image is into view or not
                    if (viewport.min < offsetBottom && viewport.max > offsetTop && image.imgHeight > image.figureHeight) {
                        posY = parseInt(image.img.css('bottom'));
                        posY -= parseInt(speed/this.options.parallaxFactor);
                        maxPosY = image.figureHeight - image.imgHeight;
                        
                        // check if img boundaries are still inside figure
                        if (posY < maxPosY) {
                            posY = maxPosY;
                        } else if (posY > 0) {
                            posY = 0;
                        } 
    
                        image.img.css('bottom', posY);
                    }
                }
            }
        }

    });

    // register new control
    is24c.lib.util.setupControl('page', null, 'page', 'html >');

    // register dom changed event
    is24c.lib.event.registerDomChangedEvent('page');

});

/**
 * IS24 corporate website components
 *
 * @title           SUB_NAV
 * @description     Fades in sub-nav to top viewport when user scrolls; disappears when user is at top of page.
 * @namespace       is24c.comp.subNav
 *
 * @author          Geier
 * @version         2014.01.07
 */
$(function() {

    can.Control.extend('is24c.classes.comp.subNav', {

        defaults: {
            currentClass    : 'current',
            hasScrolled     : false, // Used to free up computation time during scroll events.
            scrolling: {
                easing      : 'swing',
                duration    : 500,
                vanish      : 3000
            }
        }

    }, {

        reinit: function() {
            this.getSectionOffsets();
        },

        start: function(el) {
            this._var.hasScrolled   = this.options.hasScrolled;
            this._var.navHeight     = this.element.height();
            this._var.offsetTop     = can.$('#content').offset().top;
            this._var.headerHeight  = can.$('#header').height();
            this._var.linkNodes     = can.$('li', this.element).not('.back-to-top').find('a');
            this._var.scrollInitByUser = false;

            // listen to broadcast event from vacancies list (expanding)
            can.on.call(document, 'vacanciesList.listExpandEvent', can.proxy(this.getSectionOffsets, this));

            // throttle execution
            window.setInterval(can.proxy(function() {
                if (this._var.hasScrolled) {
                    this._var.hasScrolled = false;

                    //trigger new event
                    can.$(window).trigger('scrollThrottled');
                }
            }, this), 50);
        },

        /**
         * Listen to throttled scroll event
         * @param {Object} el - control element
         * @param {Object} ev - event object
         * @return {}
         */
        '{window} scrollThrottled': function (el, ev) {
            this.toggleNavBar();

            if(!this._var.scrollInitByUser) {
                this.toggleNavBarEntry();
            }

            is24c.lib.event.stop(ev);
        },

        /**
         * Simple throttling of the scroll event
         * @param {Object} el - control element
         * @param {Object} ev - event object
         * @return {}
         */
        '{window} scroll': function (el, ev) {
            this._var.hasScrolled = true;
        },

        /**
         * Attach click handlers to all scroll elements
         * @param {Object} el - control element
         * @param {Object} ev - event object
         * @return {}
         */
        '.can-scroll-to click': function (el, ev) {
            var link = can.$(ev.currentTarget);
            this._var.scrollInitByUser = true;

            this.highlightEntry(link);

            if (link.parent('li.back-to-top').length == 0) {
                link.addClass(this.options.currentClass);
            }

            this.smoothScroll(link);
            is24c.lib.event.stop(ev);
        },

        /**
        * Visually activate menu entry.
        * @param {Object} linkNode - anchor to highlight
        * @return {}
        * */
        highlightEntry: function (linkNode) {
            this._var.linkNodes.removeClass(this.options.currentClass);

            if (linkNode.parent('li.back-to-top').length == 0) {
                linkNode.addClass(this.options.currentClass);
            }
        },

        /**
         * Scroll body
         * @param {Object} emitterNode - control element
         * @return {}
         */
        smoothScroll: function (emitterNode) {
            var c               = this,
                scrollTarget    = can.$(emitterNode).attr('href'),
                currentListItem = can.$(emitterNode).closest('li'),
                allListItems    = currentListItem.closest('ul').find('li');

            can.$(scrollTarget).animatescroll({
                scrollSpeed: 2000,
                easing: 'easeInOutQuint',
                padding: allListItems.index(currentListItem) == 0 ? this._var.headerHeight : 0
            }, function () {
                c._var.scrollInitByUser = false;
            });
        },

        /**
         * Checks scrollTop value against desired offset and toggles.
         * @return {}
         */
        toggleNavBar: function () {
            (can.$(window).scrollTop() >= this._var.offsetTop) ? this.element.addClass("is-showing") : this.element.removeClass("is-showing");

            // only hide if mobile mq is active
            if (is24c.lib.util.mqMatch.get('mobile')) {
                window.clearTimeout(this._var.showTimeout);

                this._var.showTimeout = window.setTimeout(can.proxy(function() {
                    this.element.removeClass("is-showing");
                }, this), this.options.scrolling.vanish);
            }
        },
        /**
        * Activates menu entry while scrolling.
        * @return {}
        * */
        toggleNavBarEntry: function () {

            // find relevant offsets
            if(!this._var.sectionOffsets) {
                this.getSectionOffsets();
            }

            // iterate over offsets and calculate
            for (var i = 0, len = this._var.sectionOffsets.length; i < len; i++) {

                var offset = this._var.sectionOffsets[i];
                if((can.$(window).scrollTop() + this._var.navHeight) >= offset) {
                    this.highlightEntry(this._var.linkNodes.eq(i));
                }
            }
        },

        /**
         * retrieve current section offsets
         */
        getSectionOffsets: function () {
            this._var.sectionOffsets = this._var.linkNodes.map(function() {
                var href = can.$(this).attr('href');

                return Math.round(can.$(href).offset().top) - 1;
            });
        }
    });

    // register new control
    is24c.lib.util.setupControl('subNav', null, 'sub-nav');

    // register dom changed event
    is24c.lib.event.registerDomChangedEvent('subNav');
});

/**
 * IS24 corporate website components
 *
 * @title           CONTEXT_NAV
 * @description     navigation and content switch (ajax) for department pages
 * @namespace       is24c.comp.contextNav
 *
 * @author          Sunaric, Geier
 * @version         2014.01.15
 */


$(function() {

    can.Control.extend('is24c.classes.comp.contextNav', {

        defaults: {
            currentCssClass : 'current',
            openCssClass    : 'open',
            activeCssClass  : 'active',
            sectionNode     : {},
            sectionIndex    : 0,
            subNavLinkNode  : {},
            subNavLinkDivider  : ' / ',
            urlProperties   : {},
            initialAjaxDone: false,
            collapsible: {
                triggerNode : {},
                targetNode  : {},
                node        : {}
            }
        }

    }, {
        start: function () {
            this.setConfig();
            this.sanitizeLinkUrls();
            this.filterUrl();
            this.bindUI();

        },

        setConfig: function () {
            // append JS only DOM element for video container
            this.element.before('<div class="video-wrapper"/>');

            // get current sections index
            this.options.sectionNode = this.element.closest('.sectionpage');
            this.options.sectionIndex = $('#content').find('.sectionpage').index(this.options.sectionNode);

            // store original texts on link's data
            this.options.subNavLinkNode = can.$('nav.sub-nav a').eq(this.options.sectionIndex);
            this.options.subNavLinkNode.data('text', this.options.subNavLinkNode.text());

            // check if image/video is available
            var videoNode = this.options.sectionNode.find('.video-wrapper iframe'),
                imageNode = this.options.sectionNode.find('> .wrapper > .image img');

            if (videoNode.length > 0) {
                this.options.sectionNode.addClass('has-video');
            }
        },

        /*
         * Change DOM behavior when resizing based on MQs.
         * */
        bindMQEvents: function () {
            // Mobile behaviour
            if (is24c.lib.util.mqMatch.get('mobile')) {
                this.options.collapsible = is24c.lib.util.collapsible.init(this.element);
            }
        },

        /**
         * Check Page url to init Ajax loading section content.
         */
        filterUrl: function () {
            var context = this;
            this.options.urlProperties = this.parseURL(window.location);

            if(this.options.urlProperties.source.hash != '' && this.options.urlProperties.path.indexOf('content-only') != -1) {

                var link = can.$('ul', this.element).find('a').filter(function () {
                    var href = can.$(this).attr('href');
                    return (href.indexOf(context.options.urlProperties.source.pathname) != -1);
                });

                if(link.length > 0) {
                    can.$(link).trigger('click');
                }
            }
        },

        /**
         * Bind click event to Overview button.
         */
        bindUI: function () {
            var context = this;

            window.onpopstate = function(event) {
                if(event && event.state) {
                    var link = can.$('ul', this.element).find('a[href="' + event.state +'"]');
                    link.trigger('click');
                }
            };

            this.bindMQEvents();
        },

        /**
         * Remove ! from link Hrefs.
         */
        sanitizeLinkUrls: function () {
            var links = can.$('ul', this.element).find('a');

            links.each(function () {
                var strippedHref = can.$(this).attr('href').replace('!', '');
                can.$(this).attr('href', strippedHref);
            });
        },

        /**
         * Create a link and assign a valid url which then exposes easily accessible url properties.
         * @param {String} url Valid url.
         * @return {Object} return object with url properties
         */
        parseURL: function (url) {
            var a =  document.createElement('a');
            a.href = encodeURIComponent(url);
            return {
                source: url,
                protocol: a.protocol.replace(':',''),
                host: a.hostname,
                port: a.port,
                query: a.search,
                params: (function(){
                    var ret = {},
                        seg = a.search.replace(/^\?/, '').split('&'),
                        len = seg.length, i = 0, s;
                    for (; i < len; i++) {
                        if (!seg[i]) {
                            continue;
                        }
                        s = seg[i].split('=');
                        ret[s[0]] = s[1];
                    }
                    return ret;
                })(),
                file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
                hash: a.hash.replace('#',''),
                path: a.pathname.replace(/^([^\/])/,'/$1'),
                relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
                segments: a.pathname.replace(/^\//,'').split('/')
            };
        },

        /**
         * Handle link clicks; active link handling & ajax request triggering.
         * @param {Object} el Current collection element
         * @param {Object} ev Event object
         * @return {Boolean}
         */
        'ul a click': function (el, ev) {
            is24c.lib.event.stop(ev);

            if (el.hasClass(this.options.currentCssClass)) {
                return false;
            }

            el.closest('ul').find('a').removeClass(this.options.currentCssClass);
            el.addClass(this.options.currentCssClass);

            if(this.options.initialAjaxDone) {
                this._updateHistory(el);
            }
            this.options.initialAjaxDone = true;

            this._doAjaxCall(el);

            return true;
        },

        /**
         * Init an Ajax request with modified URL taken from emitter link.
         * @param {Object} node Event emitter element i.e. anchor.
         */
        _doAjaxCall: function (node) {
            $.ajax({
                dataType: "html",
                url: this._formatUrl(node.attr("href")),
                success: can.proxy(function(data) {
                    if (data) {
                        this._handleAjaxResponse(data);
                    }
                }, this)
            });
        },

        /**
         * Replace DOM elements with Ajax response.
         * @param {String} data - Ajax Response
         */
        _handleAjaxResponse: function (data) {

            // container for replaced content
            var section                 = this.options.sectionNode,
                sectionHeadlineNode     = section.find('> .wrapper > .grid > header > h2'),
                sectionParagraphNode    = section.find('> .wrapper > .grid > header > p'),
                sectionVideoNode        = section.find('.video-wrapper'),
                sectionImageNode        = section.find('> .wrapper > .image'),
                response                = can.$(data),
                headlineNode            = response.filter('h2'),
                paragraphNode           = response.filter('p'),
                videoNode               = response.filter('.video'),
                imageNode               = response.filter('.image').find('img'),
                linkText                = this.options.subNavLinkNode.data('text') + this.options.subNavLinkDivider + can.$(headlineNode).html(),
                departmentId            = response.filter('.job-search-id').text();

            can.trigger(document, 'vacanciesList.jobFilterEvent', { filterCategory: departmentId });

            // Set section classes
            this.options.sectionNode.removeClass('has-video');

            if (!is24c.lib.util.isBlank(videoNode) && videoNode.find('iframe').length > 0) {
                this.options.sectionNode.addClass('has-video');
                videoNode.find('h3').remove();
            }

            if (!is24c.lib.util.isBlank(imageNode)) {
                // fade out current image
                sectionImageNode.animate({
                    'opacity': 0
                }, 400, function() {
                    // remove old control
                    is24c.lib.util.destroyControl('image', sectionImageNode.get(0));
                    // replace image
                    sectionImageNode.find('img').replaceWith(imageNode);
                    // trigger image src calculation
                    can.trigger(document, 'domChanged', 'image');
                    // fade in new image
                    sectionImageNode.animate({
                        'opacity': 1
                    }, 1000);
                });
            }

            // update content
            sectionHeadlineNode.replaceWith(headlineNode);
            sectionParagraphNode.replaceWith(paragraphNode);

            // close list on mobile
            if (is24c.lib.util.mqMatch.get('mobile')) {
                //this.options.collapsible.triggerNode = is24c.lib.util.collapsible.init(this.element);
                can.trigger(this.options.collapsible.triggerNode, 'click');
            } else {
                // update sub-nav
                this.options.subNavLinkNode.text(linkText);
            }

            // update video
            this.element.after(sectionVideoNode);
            sectionVideoNode.html(videoNode);
        },

        /**
         * change url parts for ajax call
         * @param {String} url - url
         * @return {String} - formatted url
         */
        _formatUrl: function (url) {
            url = url.replace('!', '');
            url = url.replace(".department.html/", "/");

            return url;
        },

        /**
         * Update browser history
         * @param {Object} linkNode - visited url
         */
        _updateHistory: function (linkNode) {
            if(!is24c.lib.util.isBrowser(['ie8', 'ie9'])) {
                var href = can.$(linkNode).attr("href");
                history.pushState(href, can.$(linkNode).text(), href);
            }
        }
    });

    // register new control
    is24c.lib.util.setupControl('contextNav', null, 'context-nav');

});

/**
 * IS24 corporate website components
 *
 * @title           VACANCIES LIST
 * @description     filter job vacancies and display details
 * @namespace       is24c.comp.vacanciesList
 *
 * @author          Heimann, Geier
 * @version         2014.01.15
 */
$(function () {

    can.Control.extend('is24c.classes.comp.vacanciesList', {

        defaults: {
            css    : {
                open    : 'open',
                show    : 'show',
                current : 'current',
                hovering: 'hovering',
                expanded: 'expanded'
            },
            storage: 'is24corporate-jobFilter',
            text: {
                closeJobDetails: 'Close job details',
                openJobDetails: 'Open job details'
            }
        }

    }, {

        start: function () {
            var c = this;
            this._var.masonryIsInit = false;
            this._var.view = 'tiles';
            this._var.masonryContainer = can.$('.vacancies', this.element);
            this._var.noticeContainer = can.$('.no-results-notice', this.element);
            this._var.loadMoreButton = can.$('.load-more', this.element);

            this._initMasonry();
            this._handleUrlParams();

            // job details
            this._var.jobDetails = can.$('.job-details', this.element);
            // a) mark button with custom css class
            this._var.jobDetails.find('.button-orange__flat').addClass('ui-button cta');
            // b) remove images from details (e.g. logo)
            this._var.jobDetails.find('img').remove();

            // IE8 Treatment
            if(is24c.lib.util.isBrowser(['ie8'])) {
                this._var.masonryContainer.find('.item').hover(
                    function () {
                        can.$(this).addClass(c.options.css.hovering);
                    },
                    function () {
                        can.$(this).removeClass(c.options.css.hovering);
                    }
                );
            }

            // register listen to broadcast event from context nav
            can.on.call(document, 'vacanciesList.jobFilterEvent', this.triggerFilter);
        },

        /**
         * Initialize Masonry plugin. Doesn't init for IE8 but still works - MS magic!
         * @return {}
         */
        _initMasonry: function () {
            var c = this;

            // set initial number of tiles on portrait
            if (is24c.lib.util.mqMatch.get('tabletLandscape')) {
                this._var.masonryContainer.find('.item:gt(5)').addClass('hd');
            } else if (is24c.lib.util.mqMatch.get('tabletPortrait') || is24c.lib.util.mqMatch.get('mobile')) {
                this._var.masonryContainer.find('.item:gt(3)').addClass('hd');
            }

            if(is24c.lib.util.isBrowser(['ie8']))
                return;

            // on window resize rerun masonry to accommodate for MQ CSS changes
            if (!is24c.lib.util.mqMatch.get('mobile')) {
                c.reInitMasonry();

                can.$(window).on('resize', function () {
                    if (c._var.masonryIsInit) {
                        c.reInitMasonry();
                    }
                });
            }

            this._var.masonryContainer.transition({
                opacity : 1,
                duration: 500
            });
        },

        /**
         * Check local storage for previously used filter selections.
         * @return {}
         */
        _handleLocalStorage: function () {
            var c = this;

            // apply filters from local storage
            var savedFilters = is24c.lib.util.getStorage(this.options.storage);
            if (!is24c.lib.util.isBlank(savedFilters)) {
                this._loadAllItems();

                can.$.each(savedFilters, function (i, obj) {
                    c.triggerFilter(null, {
                        filterCategory: obj
                    });
                });
            }
        },

        /**
         * Detect jobid hash from URL and focus corresponding job details via smooth scrolling.
         * @return {}
         */
        _handleUrlParams: function () {
            var jobId           = window.encodeURI(window.location.hash.substring(1, window.location.hash.length)),
                listItem          = can.$('[data-id="' + jobId + '"]', this._var.masonryContainer),
                timeoutDelays =  is24c.lib.util.mqMatch.get('mobile') ? 2000 : 500;

            if(listItem.length > 0) {
                this._loadAllItems();

                // required to address DOM load timing issues
                setTimeout(function () {
                    listItem.trigger('click');

                    // required to wait again as the offset.top() of target element changes during previously triggered animation
                    setTimeout(function () {
                        can.$(listItem).animatescroll({
                            scrollSpeed: 2000,
                            easing: 'easeInOutQuint',
                            padding: is24c.lib.util.mqMatch.get('mobile') ? 0 : can.$('main > .sub-nav').height()
                        });
                    }, timeoutDelays);

                }, timeoutDelays);
            } else {
                // if no URL params found then open with last filter settings
                this._handleLocalStorage();
            }
        },

        /**
         * Convenience function to trigger load more button.
         * @return {}
         */
        _loadAllItems: function () {
            this._var.loadMoreButton.trigger('click');
        },

        /**
         * Find relevant filter entry and trigger a click.
         * @param {Object} ev - triggered element
         * @param {Object} args - must contain .filerCategory
         */
        triggerFilter: function (ev, args) {
            var liNode = [];

            if (args.filterCategory) {
                liNode = can.$('.ui-select', this.element).find('li[data-category="' + args.filterCategory + '"]');
            }

            if (liNode.length > 0) {
                liNode.parent('.ui-select').trigger('click');
                liNode.delay(250).trigger('click');
            }
        },

        /**
         * Add event listener to tag filter
         * @param {Object} el - triggered element
         * @param {Object} ev - triggered event
         */
        '.ui-select click': function (el, ev) {
            is24c.lib.event.stop(ev);

            var items = el.children('li'),
                currentItem = items.filter('.' + this.options.css.current);

            this._toggleItems(items, currentItem);
        },

        /**
         * Add event listener to tag filter
         * @param {Object} el - triggered element
         * @param {Object} ev - triggered event
         */
        '.ui-select li click': function (el, ev) {
            if (!el.hasClass(this.options.css.current)) {
                is24c.lib.event.stop(ev);

                var items = el.closest('ul').children('li');
                this._setItemState(items, el);
                this._toggleItems(items, el);
                this._filterElementsByCategory();
            }
        },

        /**
         * Apply selected filters.
         * @return {}
         */
        _filterElementsByCategory: function () {
            var listElements = this._var.masonryContainer.find('> li'),
                filteredElements = listElements;

            this._loadAllItems();
            this._var.noticeContainer.hide();

            // reset items
            this.setExpanded(listElements, false);
            listElements.addClass('item').removeClass('hd');

            var activeFilters = can.$('.ui-select', this.element).find('.current').map(function () {
                var value = can.$(this).attr('data-category');
                return value === 'all' ? null : value;
            });

            //make array as .map can return just a string
            activeFilters = $.makeArray(activeFilters);

            // local storage filters
            is24c.lib.util.setStorage(this.options.storage, activeFilters);

            // don't filter if twice "all"
            if (activeFilters.length !== 0) {

                filteredElements = listElements.filter(function () {
                    var match = true;

                    //look for class combination on items, order matters
                    for (var i = 0; i < activeFilters.length; i++) {
                        if (can.$(this).hasClass(activeFilters[i])) {
                            match = false;
                        } else {
                            match = true;
                            break;
                        }
                    }

                    return match;
                });

                // hide all elements not matching the classes
                filteredElements
                    .addClass('hd')
                    .removeClass("item");
            }

            if (filteredElements.length < listElements.length) {
            } else if (activeFilters.length === 0) {
                this._var.noticeContainer.hide();
            } else if (filteredElements.length === listElements.length) {
                this._var.noticeContainer.show();
            }

            if (is24c.lib.util.mqMatch.get('mobile')) {
                this._var.masonryContainer.find('.item:gt(3)').addClass('hd').removeClass('item');
            }

            if (this._var.view == 'tiles' && this._var.masonryIsInit) {
                this._var.masonryContainer.masonry('layout');
            }
        },

        /**
         * "Load More" button handler.
         * @param {Object} el - control element
         * @param {Object} ev - event object
         * @return {}
         */
        '.load-more click': function (el, ev) {
            is24c.lib.event.stop(ev);

            el.addClass('hd');
            el.unbind('click');

            // show all (formerly hidden) jobs
            this._var.masonryContainer.find('.hd').removeClass('hd');

            if (this._var.view == 'tiles') {
                this._var.masonryContainer.masonry('layout');
            }

            // send broadcast event to sub-nav
            can.trigger(document, 'vacanciesList.listExpandEvent');
        },

        /**
         * "Trigger close of filter dropdowns
         * @param {Object} el - control element
         * @param {Object} ev - event object
         * @return {}
         */
        'click': function (el, ev) {
            is24c.lib.event.stop(ev);

            el.find('.ui-select.open').trigger('click');
        },

        /**
         * Add event listener to tag filter
         * @param {Object} el - triggered element
         * @param {Object} ev - triggered event
         * @return {}
         */
        '.list-views a click': function (el, ev) {
            is24c.lib.event.stop(ev);

            // trigger closing of open dropdowns
            this.element.trigger('click');

            var node = can.$(el),
                type = node.data('view');

            can.$('.list-views', this.element).find('a').removeClass(this.options.css.current);
            can.$(el).addClass(this.options.css.current);

            this._var.masonryContainer.removeClass('tiles list').toggleClass(type);

            this._var.view = type;

            if (this._var.view == 'tiles') {
                if(!is24c.lib.util.isBrowser(['ie8'])) {
                    this.reInitMasonry();
                }
            } else {
                if (jQuery().masonry) {
                    this._var.masonryContainer.masonry('destroy');
                    this._var.masonryIsInit = false;
                }
            }
        },

        /**
         * Reinit Masonry plugin for modern browsers during view change.
         * @return {}
         */
        reInitMasonry: function () {
            if (jQuery().masonry) {
                this._var.masonryContainer.masonry();
                this._var.masonryContainer.masonry('destroy');
            }

            this._var.masonryContainer.masonry({
                columnWidth : this.getMasonryTileSize(),
                itemSelector: '.item',
                gutter      : 16,
                isFitWidth  : true,
                transitionDuration: !Modernizr.csstransitions ? 400 : 0
            });

            this._var.masonryContainer.masonry('layout');
            this._var.masonryIsInit = true;
        },

        /**
         * Return tile size based on detected mqMatch.
         * @return {int} size in pixel
         */
        getMasonryTileSize: function () {
            var size = 264;

            if (is24c.lib.util.mqMatch.get('tabletPortrait')) {
                size = 352;
            } else if (is24c.lib.util.mqMatch.get('tabletLandscape')) {
                size = 314;
            }

            return size;
        },

        /**
         * Click handler to open job details.
         * @param {Object} el - triggered element
         * @param {Object} ev - triggered event
         * @return {}
         */
        '.vacancies li click': function (el, ev) {
            // trigger closing of open dropdowns
            this.element.trigger('click');

            var emitterNode = can.$(ev.target);

            // find what was clicked; orange button and regular links open tabs, .toggle-details toggles 'expanded' class
            if(emitterNode.parent().andSelf().hasClass('button-orange__flat')) {
                var href = emitterNode.attr('href') ? emitterNode.attr('href') : emitterNode.parent().attr('href');
                window.open(href,'_blank');
            } else if (emitterNode.is('a') && !emitterNode.hasClass('toggle-details')) {
                window.open(emitterNode.attr('href'),'_blank');
            }
            else {
                var node = can.$(el);
                this.setExpanded(this._var.masonryContainer.find('li').not(node), false);
                this.setExpanded(node, node.hasClass(this.options.css.expanded) ? false : true);

                if (this._var.view && this._var.masonryIsInit) {
                    this._var.masonryContainer.masonry('layout');
                }
            }
        },

        /**
         * toggle expanded state of list item
         * @param {object} li - list item
         * @param {boolean} open - new list item state
         */
        setExpanded: function(li, open) {
            open ? 
                li.addClass(this.options.css.expanded).find('.job-open a').text(this.options.text.closeJobDetails) :
                li.removeClass(this.options.css.expanded).find('.job-open a').text(this.options.text.openJobDetails);
        },

        /**
         * Set states of a list item collection
         *  @param {Object} items - collection of (list items)
         *  @param {Object} currentItem - clicked list item
         *  @return {}
         */
        _setItemState: function (items, currentItem) {
            // remove former current state
            items.filter('.' + this.options.css.current).addClass(this.options.css.show).removeClass(this.options.css.current);
            // make current
            currentItem.addClass(this.options.css.current).removeClass(this.options.css.show);
        },

        /**
         * Set visibility of a list item collection
         *  @param {Object} items - collection of (list items)
         *  @param {Object} currentItem - clicked list item
         *  @return {}
         */
        _toggleItems: function (items, currentItem) {
            items.closest('ul').toggleClass(this.options.css.open);
            items.not(currentItem).toggleClass(this.options.css.show);
        }
    });

    // register new control
    is24c.lib.util.setupControl('vacanciesList', null, 'vacancies-list');
});

/**
 * IS24 corporate website components
 *
 * @title           VACANCIES LIST
 * @description     filter job vacancies and display details
 * @namespace       is24c.comp.vacanciesList
 *
 * @author          Heimann, Geier
 * @version         2014.01.15
 */
$(function () {

    can.Control.extend('is24c.classes.comp.vacanciesList', {

        defaults: {
            css : {
                show    : 'show',
                current : 'current',
                hovering: 'hovering'
            },
            view: 'list'
        }

    }, {
        start: function (el) {

        }
    });

    // register new control
    //is24c.lib.util.setupControl('vacanciesList', null, 'vacancies-list');
});

/**
 * IS24 corporate website components
 * 
 * @title           JOBCAROUSEL
 * @description     Display teaser opened job categories
 * @namespace       is24c.comp.jobcarousel
 * 
 * @author          Geier
 * @version         2014.03.04
 */

$(function() {

    can.Control.extend('is24c.classes.comp.jobcarousel', {
        
        defaults: {
            css: {
                current: 'current'
            }
        }

    }, {

        reinit: function() {
            // react for resize and orientation changes

            if (!is24c.lib.util.mqMatch.get('mobile')) {
                this._doCalculations();
                this._slideToPage(this._var.currentPage);
            }
        },

        start: function() {

            // setting internals
            this._var.frame         = can.$('.frame', this.element);
            this._var.slidee        = can.$('.slider', this.element);
            this._var.items         = can.$('.item', this.element);
            this._var.thumbs        = can.$('.portraits', this.element).find('li');
            this._var.currentPage   = 1;

            this._var.controls = {
                prev: can.$('.prev', this.element),
                next: can.$('.next', this.element)
            };

            if (is24c.lib.util.mqMatch.get('mobile')) {
                this._extendDom();
            } else {
                this._doCalculations();
            }
        },

        _extendDom: function () {
            can.each(this._var.thumbs, can.proxy(function (obj, i) {
                var text = this._var.items.not(':first').eq(i).find('p');
                can.$(obj).append('<div class="text"><div class="inner"/></div>').find('.inner').append(text);
            }, this));
        },

        /**
         * Calculates widths of DOM elements to allow sliding.
         * @return {}
         */
        _doCalculations: function () {
            this._var.showPerPage   = 1;
            this._var.frameWidth    = this._var.frame.width();
            this._var.itemWidth     = this._var.frameWidth;
            this._var.pages         = this._var.items.length;
            this._var.pageWidth     = this._var.itemWidth;

            // grow ul to actual size
            this._var.slidee.width(this._var.pageWidth * this._var.pages);
            this._var.items.width(this._var.frameWidth);
        },

        _firstPage: function () {
            this._var.currentPage = 1;
            this._slideToPage(this._var.currentPage);
        },

        _lastPage: function () {
            this._var.currentPage = this._var.pages;
            this._slideToPage(this._var.currentPage);
        },

        _nextPage: function () {
            if(this._var.currentPage == this._var.pages) {
                this._firstPage();
            } else {
                this._slideToPage(++this._var.currentPage);
            }
        },

        _prevPage: function () {
            if(this._var.currentPage == 1) {
                this._lastPage();
            } else {
                this._slideToPage(--this._var.currentPage);
            }
        },

        /**
         * Simple throttling of the scroll event
         * @param {int} page - page number starting with 1
         * @return {}
         */
        _slideToPage: function (page) {

            this._var.currentPage = page;

            if (!is24c.lib.util.mqMatch.get('mobile')) {
                this._highlightSelection(page);
                this._handleControls(page);
            }

            this._var.frame.toggleClass('introduction', page == 1);

            var xOffset = --page * this._var.pageWidth;

            if(is24c.lib.util.isBrowser(['ie8', 'ie9'])) {
                this._var.slidee.animate({
                    left: -xOffset
                }, 1000, 'swing')
            } else {
                this._var.slidee.transition({
                        translate: [-xOffset, 0]
                    });
            }

        },

        /**
         * Highlights the correct thumbnail.
         * @param {int} index - page number starting with 1
         * @return {}
         */
        _highlightSelection: function (index) {
            this._var.thumbs.removeClass('current');
            this._var.thumbs.eq(parseInt(index) - 2).addClass("current");
        },

        /**
         * Toggles left/right arrow depending on current slide displayed.
         * @param {int} page - page number starting with 1
         * @return {}
         */
        _handleControls: function (page) {

            switch (page) {
                case 1:
                    this._var.controls.prev.hide();
                    this._var.controls.next.show();
                    break;
                case 5:
                    this._var.controls.prev.show();
                    this._var.controls.next.hide();
                    break;
                default:
                    can.each(this._var.controls, function (control) {
                        can.$(control).show();
                    });
            }
        },

        /**
         * Click behavior on thumbnails. Slides in corresponding content.
         * @param {Object} el - control element
         * @param {Object} ev - event object
         * @return {}
         */
        '.portraits li click': function (el, ev) {
            is24c.lib.event.stop(ev);

            var index   = this._var.thumbs.index(el);

            if (!is24c.lib.util.mqMatch.get('mobile')) {
                this._slideToPage(parseInt(index) + 2);
            } else {
                is24c.lib.util.collapsible.slideToggle(ev, el.find('.inner'), el);
            }
        },

        '.next click': function (el, ev) {
            is24c.lib.event.stop(ev);
            this._nextPage();
        },

        '.prev click' :function (el, ev) {
            is24c.lib.event.stop(ev);
            this._prevPage();
        }

    });

    // register new control
    is24c.lib.util.setupControl('jobcarousel');

    // register dom changed event
    is24c.lib.event.registerDomChangedEvent('jobcarousel');

});

/**
 * Configuration for foresight.js script
 * 
 * @description     sets start parameter and image-sets for foresight image handling
 * 
 * @author          Heimann
 * @version         2013.12.12
 */

var foresight = {
    
    options: {
        // own is24c properties (font size in px)
        is24c: {
            loadingClass: 'loading',
            imgRequestStepSize: 50,
            imgRequestMaxSize: 2560,
            trigger: false,
            imageStyles: [
                {
                    cssSelector: '#ui .image.loading img[data-src]',
                    imageSet: [
                        { url: '{directory}{filename}.adapt.{requestWidth}.low.{ext}/{cachekiller}/{seoname}.{ext}' },
                        { url: '{directory}{filename}.adapt.{requestWidth}.medium.{ext}/{cachekiller}/{seoname}.{ext}', bandwidth: 'high-bandwidth' },
                        { url: '{directory}{filename}.adapt.{requestWidth}.medium.{ext}/{cachekiller}/{seoname}.{ext}', scale: '2x', bandwidth: 'high-bandwidth' }
                    ],
                    mediaQuery: 'all',
                    property: ['content', 'font-family']
                }, {
                    cssSelector: '#ui .image.loading img[data-src]',
                    imageSet: [
                        { url: '{directory}{filename}.adapt.{requestWidth}.medium.{ext}/{cachekiller}/{seoname}.{ext}' },
                        { url: '{directory}{filename}.adapt.{requestWidth}.high.{ext}/{cachekiller}/{seoname}.{ext}', bandwidth: 'high-bandwidth' },
                        { url: '{directory}{filename}.adapt.{requestWidth}.high.{ext}/{cachekiller}/{seoname}.{ext}', scale: '2x', bandwidth: 'high-bandwidth' }
                    ],
                    mediaQuery: 'only screen and (min-width: 1025px)',
                    property: ['content', 'font-family']
                }
            ]
        }
    },

    updateComplete: function() {
        if (foresight.options.is24c.trigger) {
            foresight.options.is24c.trigger = false;
        } else {
            is24c.lib.debug.log('DOM changed: Update triggered by foresight.js', 'info');
            can.trigger(document, 'domChanged');
        }

        is24c.lib.debug.log('Images ready (foresight.js)', 'info');
        can.trigger(document, 'imagesReady');
    }

};


(function() {

    /**
     * create css image-set definitions for foresight script
     */
    foresight.initStyles = function() {
        var imageStyles = foresight.options.is24c.imageStyles;
        
        if (imageStyles !== undefined) {
            var styles = '<style type="text/css">';
    
            for (var i = 0; i < imageStyles.length; i++) {
                styles += '@media ' + imageStyles[i].mediaQuery + '{';
                styles += imageStyles[i].cssSelector + '{';
    
                for (var j = 0; j < imageStyles[i].property.length; j++) {
                    styles += imageStyles[i].property[j] + ': "image-set(';
    
                        for (var k = 0; k < imageStyles[i].imageSet.length; k++) {
                            var set = imageStyles[i].imageSet[k];
                            if (set.url !== undefined) {
                                styles += k != 0 ? ',' : '';
                                styles += 'url(' + set.url + ')';
                                styles += set.scale !== undefined ? ' ' + set.scale : '';
                                styles += set.bandwidth !== undefined ? ' ' + set.bandwidth : '';
                            }
                        }
    
                    styles += ')";';
                }
    
                styles += '}}';
            }
    
            styles += '</style>';
    
            $('head').append(styles);
        } 
    }();

})();

(function(e,t,n,r){"use strict";e.images=[];e.options=e.options||{};var i=e.options,s=i.hiResClassname||"fs-high-resolution",o=i.lowResClassname||"fs-standard-resolution",u="devicePixelRatio",a="devicePixelRatioRounded",f="bandwidth",l="requestChange",c="defaultSrc",h="highResolutionSrc",p="browserWidth",d="browserHeight",v="requestWidth",m="requestHeight",g="width",y="height",b="widthUnits",w="heightUnits",E="aspectRatio",S="appliedImageSetItem",x="scale",T="scaleRounded",N="uriTemplate",C="uriFind",k="uriReplace",L="srcModification",A="loading",O="complete",M="auto",_="percent",D="auto",P="pixel",H="display",B="auto",j=true,F=false,I=/url\((?:([a-zA-Z-_0-9{}\?=&\\/.:\s]+)|([a-zA-Z-_0-9{}\?=&\\/.:\s]+)\|([a-zA-Z-_0-9{}\?=&\\/.:\s]+))\)/g,q=/[^\d]+/,R,U,z=function(){if(R)return;R=A;X();R=O;K()},W=function(e,t){if(n.createEvent){var r=n.createEvent("Event");r.initEvent("foresight-"+e,j,j);t.dispatchEvent(r)}},X=function(){var t,r,i,s;e.images=[];for(t=0;t<n.images.length;t++){r=n.images[t];if(r.ignore)continue;if(!r.initalized){r.initalized=j;W("imageInitStart",r);r[c]=J(r,"src");r[b]=J(r,g,j);r[w]=J(r,y,j);var o=J(r,"aspect-ratio",F);r[E]=o===M?o:!isNaN(o)&&o!==null?parseFloat(o):0;if(!r[c]){r.ignore=j;continue}r[h]=J(r,"high-resolution-src");r.orgClassName=r.className?r.className:"";r.onerror=lt;W("imageInitEnd",r)}e.images.push(r);if(is24c.lib.util.isBlank(r.imageSetText)){s=rt(r,"content","content");if(s==="normal"||is24c.lib.util.isBlank(s)&&is24c.lib.util.isBlank(r.imageSetText)){s=rt(r,"font-family","fontFamily")}if(!is24c.lib.util.isBlank(s)&&s!=="none"){r.imageSetText=s}}r.imageSet=[];if(r.imageSetText&&r.imageSetText.length>1){V(r,r.imageSetText.split("image-set(")[1])}}},V=function(e,t){var n,r=t!==undefined&&t!==null?t.split(","):[],i,s;for(n=0;n<r.length;n++){i={text:r[n],weight:0};if(i.text.indexOf(" 1.5x")>-1){i.weight++;i[x]=1.5}else if(i.text.indexOf(" 2x")>-1){i[x]=2}else if(i.text.indexOf(" 1x")>-1){i[x]=1}if(i.text.indexOf(" high-bandwidth")>-1){i[f]="high"}else if(i.text.indexOf(" low-bandwidth")>-1){i[f]="low"}while(s=I.exec(i.text)){if(s[1]!=null&&s[1]!==""){i[N]=s[1];i.weight++}else if(s[2]!=null&&s[2]!==""){i[C]=s[2];i[k]=s[3];i.weight++}}if(i[x]&&i[f]){i.weight+=2}else if(i[x]||i[f]){i.weight++}e.imageSet.push(i)}e.imageSet.sort($)},$=function(e,t){if(e.weight<t.weight)return 1;if(e.weight>t.weight)return-1;return 0},J=function(e,t,n,r){r=e.getAttribute("data-"+t);if(n&&r!==null){if(!isNaN(r)){return parseInt(r,10)}return 0}return r},K=function(){if(!(U===O&&R===O))return;var t,n=e.images.length,r,i,u,a,f=[],l;for(t=0;t<n;t++){r=e.images[t];if(!et(r)){continue}W("imageRebuildStart",r);u=r.orgClassName.split(" ");tt(r);if(r.unitType==P&&!is24c.lib.util.isBrowser(["ie8"])){var h=ot(r[p]);var v=ot(r[d]);a="fs-"+h+"x"+v;u.push(a);if(f[a]==undefined){f[a]=j;f.push("."+a+"{width:"+(r[p]>0?h+"px;":"inherit;")+" height:"+(r[d]>0?v+"px;":"auto;")+"}")}}Z(r);Q(r);if(e.hiResEnabled&&r.src!==r[c]){u.push(s)}else{u.push(o)}u.push("fs-"+r[L]);r.className=u.join(" ");W("imageRebuildEnd",r)}if(f.length){st(f)}if(e.updateComplete){e.updateComplete()}},Q=function(t){var n,r;if(t[S][x]>1&&t[S][f]==="high"){n=t[p]===undefined?B:Math.round(t[p]*t[S][x]);r=t[d]===undefined?B:Math.round(t[d]*t[S][x]);e.hiResEnabled=j}else{n=t[p]===undefined?B:t[p];r=t[d]===undefined?B:t[d];e.hiResEnabled=F}n=G(n);r=G(r);if(!t[v]||n>t[v]||t.activeImageSetText!==t.imageSetText){t[v]=n;t[m]=r;if(t[h]&&e.hiResEnabled){t.src=t[h];t[L]="src-hi-res"}else{t.src=Y(t)}t[l]=j;t.activeImageSetText=t.imageSetText}else{t[l]=F}},G=function(t){var n=0;if(t=="auto"){n=t}else{n=Math.ceil(t/e.options.is24c.imgRequestStepSize)*e.options.is24c.imgRequestStepSize;if(n>e.options.is24c.imgRequestMaxSize){n=e.options.is24c.imgRequestMaxSize}}return n},Y=function(e){if(e[S][N]){e[L]="src-uri-template";return ut(e)}else if(e[S][C]&&e[S][k]){e[L]="src-find-replace";return ft(e)}e[L]="src-default";return e[c]},Z=function(t){var n,r,i={};for(n=0;n<t.imageSet.length;n++){r=t.imageSet[n];if(r[x]&&r[f]){if(e[u]==r[x]&&e[f]===r[f]){i=r;break}else if(Math.round(e[u])==r[x]&&e[f]===r[f]){i=r;break}}else if(r[x]){if(e[u]==r[x]){i=r;break}else if(Math.round(e[u])==r[x]){i=r;break}}else if(r[f]){if(e[f]===r[f]){i=r;break}}else{i=r}}if(!i[x]){i[x]=e[u]}if(!i[f]){i[f]=e[f]}i[T]=Math.round(i[x]);t[S]=i},et=function(e,t){t=e.parentNode;if(t.clientWidth){return j}if(rt(t,"display")==="inline"){return et(t)}return F},tt=function(e,t){if(!e.unitType){var n=e.style[H];e.style[H]="none";t=rt(e,g);e.style[H]=n;if(e[E]&&t==="auto"||t.indexOf("%")>0){e.unitType=_}else{e.unitType=P;if(e[E]&&e[E]!==M){if(e[w]){e[p]=Math.round(e[HEIGHT_UNTIS]/e[E]);e[d]=e[w]}else{e[p]=e[b]||t.replace(q,"");e[d]=Math.round(e[p]/e[E])}}else{e[p]=e[b];e[d]=e[w]}}}if(e.unitType===_||e[E]){e.computedWidth=nt(e);e[p]=e.computedWidth;if(e[E]!=M&&e[E]!==0){e[d]=Math.round(e[p]/e[E])}else if(e[w]){e[d]=Math.round(e[w]*(e.computedWidth/e[b]))}if(e[d]&&r.appVersion.indexOf("MSIE")>-1){e.style.height=e[d]+"px"}}},nt=function(e){if(e.offsetWidth!==0){return e.offsetWidth}else{var t,n,r={},i={position:"absolute",visibility:"hidden",display:"block"};for(n in i){r[n]=e.style[n];e.style[n]=i[n]}t=e.offsetWidth;for(n in i){e.style[n]=r[n]}return t}},rt=function(e,t,r){if(!r){r=t}return n.defaultView?n.defaultView.getComputedStyle(e,null).getPropertyValue(t):e.currentStyle[r]},it,st=function(e,t){if(!it){it=n.createElement("style");it.setAttribute("type","text/css")}t=e.join("");try{it.innerHTML=t}catch(r){it.styleSheet.cssText=t}if(it.parentElement==null){n.getElementsByTagName("head")[0].appendChild(it)}},ot=function(t,n){if(!(e[u]>1&&n)){t*=is24c.lib.util.getFontSizeScale()}return parseInt(t)},ut=function(t){function s(e){var t=e.parentNode;return t.className.indexOf("image")!=-1?t:s(t)}var n,r=["src","protocol","host","port","directory","file","filename","cachekiller","seoname","ext","query",v,m,x,T],i=t[S][N];t.uri=at(t[c]);if(t.unitType!==_){t[v]=G(ot(t[v],true))}var o=s(t);var u=o.className.split(" ");for(var a=0;a<u.length;a++){if(u[a]===e.options.is24c.loadingClass){u.splice(a,1)}}o.className=u.join(" ");t.uri.src=t[c];t.uri[v]=t[v];t.uri[m]=t[m];t.uri[x]=t[S][x];t.uri[T]=t[S][T];for(n=0;n<r.length;n++){i=i.replace(new RegExp("{"+r[n]+"}","g"),t.uri[r[n]])}return i},at=function(e){var t={key:["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],q:{name:"queryKey",parser:/(?:^|&)([^&=]*)=?([^&]*)/g},parser:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/},n=t.parser.exec(e),r={},i=14;while(i--)r[t.key[i]]=n[i]||"";r[t.q.name]={};r[t.key[12]].replace(t.q.parser,function(e,n,i){if(n)r[t.q.name][n]=i});var s=r.file.split(".");r.filename=s[0];r.ext=s.length>1?s[s.length-1]:"";r.cachekiller=s.length>1?s[1]:"";r.seoname=s.length>2?s[2]:r.filename;return r},ft=function(e){var t=e[S][C].replace("{browserWidth}",e[b]).replace("{browserHeight}",e[w]);var n,r=e[c].replace(t,e[S][k]),i=[v,m,x,T];e[x]=e[S][x];e[T]=e[S][T];for(n=0;n<i.length;n++){r=r.replace("{"+i[n]+"}",e[i[n]])}return r},lt=function(e){e=this;e.className=e.className.replace(s,o);e[L]="response-error";if(e.hasError||e.src===e[c])return;e.hasError=j;e.src=e[c]},ct,ht=function(){if(R!==O||U!==O)return;X();K()};e.resolve=function(e,t){t.imageSet=[];V(t,e);Z(t);Q(t);t.src=Y(t)};e.reload=function(){t.clearTimeout(ct);ct=t.setTimeout(ht,250)};e.ready=function(){if(!n.body||can.isEmptyObject(is24c.lib)){return t.setTimeout(e.ready,1)}pt();dt();z()};if(n.readyState===O){setTimeout(e.ready,1)}else{if(n.addEventListener){n.addEventListener("DOMContentLoaded",e.ready,F);t.addEventListener("load",e.ready,F)}else if(n.attachEvent){n.attachEvent("onreadystatechange",e.ready);t.attachEvent("onload",e.ready)}}var pt=function(){e[u]=i.forcedPixelRatio?i.forcedPixelRatio:is24c.lib.util.getDevicePixelRatio();e[a]=Math.round(e[u])},dt=function(){var t=is24c.lib.perf.getConnectionTestResults();e[f]=t.bandwidth;U=t.status}})(this.foresight=this.foresight||{},this,document,navigator);
/**
 * IS24 corporate website components
 * 
 * @title           IMAGE
 * @description     reinit responsive image script (foresight)
 * @namespace       is24c.comp.image
 * 
 * @author          Heimann
 * @version         2014.01.14
 */

$(function() {

    can.Control.extend('is24c.classes.comp.image', {

        start: function() {
            this.checkImage();
            
            this.addBorder();
        },
        
        /**
         * will be triggered, if domChanged event was fired
         */
        reinit: function() {
            this.checkImage();
        },
        
        /**
         * check if foresight script needs to be called again 
         */
        checkImage: function() {
            // only call foresight script, if the image has changed and new image is provided
            var img = can.$('img', this.element),
                loading = this.element.hasClass('loading');

            if (img.length > 0 && !is24c.lib.util.isBlank(img.attr('data-src'))) {
                // mark images as new, which have obviously been updated after page load
                if (!loading && is24c.lib.util.isBlank(img.attr('src'))) {
                    this.element.addClass('loading');
                    loading = true;
                }

                if (loading) {
                    foresight.options.is24c.trigger = true;
                    foresight.reload();
                }
            }
        },

        /**
         * add small border overlay at bottom of image
         */
        addBorder: function() {
            if (can.$('> .border', this.element).length == 0) {
                this.element.append('<div class="border"/>');
            }
        }
    });

    // register new control
    is24c.lib.util.setupControl('image');

    // register dom changed event
    is24c.lib.event.registerDomChangedEvent('image');

});

/**
 * IS24 corporate website components
 *
 * @title           CONTACT
 * @description     add open/close toggle for mobile contact teaser
 * @namespace       is24c.comp.contact
 *
 * @author          Geier
 * @version         2014.01.28
 */

$(function() {

    can.Control.extend('is24c.classes.comp.contact', {

        defaults: {
            collapsible: {
                triggerNode : {},
                targetNode  : {},
                node        : {}
            }
        }

    }, {

        start: function() {
            this.bindMQEvents();
        },

        /*
         * Change DOM behavior for Mobile.
         */
        bindMQEvents: function () {

            // moving contact teaser before first #content parsys
            if (is24c.lib.util.mqMatch.get('mobile')) {
                can.$(this.element).insertBefore(can.$('#content').find('.sectionpage:first .parsys:first')).show();
                this.options.collapsible = is24c.lib.util.collapsible.init(this.element);
            }
        }
    });

    // register new control
    is24c.lib.util.setupControl('contact');
});

