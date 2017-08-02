"use strict"

var Akmii = window.Akmii || {};

(function () {

    if (Object.defineProperty && Object.defineProperties) {

    } else {

        var DONT_ENUM = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(","),
            hasOwn = ({}).hasOwnProperty;
        for (var i in {
            toString: 1
        }) {
            DONT_ENUM = false;
        }

        Object.keys = Object.keys || function (obj) { //ecma262v5 15.2.3.14
            var result = [];
            for (var key in obj)
                if (hasOwn.call(obj, key)) {
                    result.push(key)
                }
            if (DONT_ENUM && obj) {
                for (var i = 0; key = DONT_ENUM[i++];) {
                    if (hasOwn.call(obj, key)) {
                        result.push(key);
                    }
                }
            }
            return result;
        };

        //dose not support get set
        Object.defineProperty = function (target, property, member) {
            if (member.value !== undefined) {
                target[property] = member.value;
                return;
            }
            target[property] = member;
        }

        Object.defineProperties = function (target, members) {
            for (var key in members) {
                Object.defineProperty(target, key, members[key]);
            }
        }
    }

})();


(function (global) {

    function initializeProperties(target, members) {
        var keys = Object.keys(members);
        var properties;
        var i, len;
        for (i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            var enumerable = key.charCodeAt(0) !== /*_*/ 95;
            var member = members[key];
            if (member && typeof member === 'object') {
                if (member.value !== undefined || typeof member.get === 'function' || typeof member.set === 'function') {
                    if (member.enumerable === undefined) {
                        member.enumerable = enumerable;
                    }
                    properties = properties || {};
                    properties[key] = member;
                    continue;
                }
            }
            if (!enumerable) {
                properties = properties || {};
                properties[key] = {
                    value: member,
                    enumerable: enumerable,
                    configurable: true,
                    writable: true
                }
                continue;
            }
            target[key] = member;
        }
        if (properties) {
            Object.defineProperties(target, properties);
        }
    }

    //extension to jquery, containsi case insensitive
    $.extend($.expr[':'], {
        'containsi': function (elem, i, match, array) {
            return (elem.textContent || elem.innerText || '').toLowerCase()
                .indexOf((match[3] || "").toLowerCase()) >= 0;
        }
    });


    (function (rootNamespace) {

        // Create the rootNamespace in the global namespace
        if (!global[rootNamespace]) {
            global[rootNamespace] = Object.create(Object.prototype);
        }

        // Cache the rootNamespace we just created in a local variable
        var _rootNamespace = global[rootNamespace];

        //if (!_rootNamespace.Namespace) {
        //    _rootNamespace.Namespace = Object.create(Object.prototype);
        //}

        function defineWithParent(parentNamespace, name, members) {
            var currentNamespace = parentNamespace,
                namespaceFragments = name.split(".");

            for (var i = 0, len = namespaceFragments.length; i < len; i++) {
                var namespaceName = namespaceFragments[i];
                if (!currentNamespace[namespaceName]) {
                    Object.defineProperty(currentNamespace, namespaceName, {
                        value: {},
                        writable: false,
                        enumerable: true,
                        configurable: true
                    });
                }
                currentNamespace = currentNamespace[namespaceName];
            }

            if (members) {
                initializeProperties(currentNamespace, members);
            }

            return currentNamespace;
        }

        function defineNS(name, members) {
            return defineWithParent(global, name, members);
        }

        function markSupportedForProcessing() {
            return {
                value: function (func) {
                    func.supportedForProcessing = true;
                    return func;
                },
                configurable: false,
                writable: false,
                enumerable: true
            }
        }

        function define(constructor, instanceMembers, staticMembers) {
            constructor = constructor || function () { };
            markSupportedForProcessing(constructor);
            if (instanceMembers) {
                initializeProperties(constructor.prototype, instanceMembers);
            }
            if (staticMembers) {
                initializeProperties(constructor, staticMembers);
            }
            return constructor;
        }


        // Establish members of the "Akmii" namespace
        Object.defineProperties(_rootNamespace, {
            defineWithParent: {
                value: defineWithParent,
                writable: true,
                enumerable: true,
                configurable: true
            },
            defineNS: {
                value: defineNS,
                writable: true,
                enumerable: true,
                configurable: true
            },
            define: {
                value: define,
                writable: true,
                enumerable: true,
                configurable: true
            }
        });
    })("Akmii");


    (function (namespace) {
        var dateFormat = function () {
            var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
                timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
                timezoneClip = /[^-+\dA-Z]/g,
                pad = function (val, len) {
                    val = String(val);
                    len = len || 2;
                    while (val.length < len) val = "0" + val;
                    return val;
                };

            // Regexes and supporting functions are cached through closure
            return function (date, mask, utc) {
                var dF = dateFormat;

                // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
                if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
                    mask = date;
                    date = undefined;
                }
                var ua = navigator.userAgent.toLowerCase(),
                    rMsie = /(msie\s|trident.*rv:)([\w.]+)/,
                    isIE = rMsie.exec(ua) != null;
                if (!isIE && typeof date === "string") {
                    date = date.replace("T", ' ');
                }
                // Passing date through Date applies Date.parse, if necessary
                date = date ? new Date(date) : new Date;
                if (isNaN(date)) return ""; // throw SyntaxError("invalid date");
                if (date.getTime() == -62135596800000) return ""; //min value in c#

                mask = String(dF.masks[mask] || mask || dF.masks["default"]);

                // Allow setting the utc argument via the mask
                if (mask.slice(0, 4) == "UTC:") {
                    mask = mask.slice(4);
                    utc = true;
                }

                var _ = utc ? "getUTC" : "get",
                    d = date[_ + "Date"](),
                    D = date[_ + "Day"](),
                    m = date[_ + "Month"](),
                    y = date[_ + "FullYear"](),
                    H = date[_ + "Hours"](),
                    M = date[_ + "Minutes"](),
                    s = date[_ + "Seconds"](),
                    L = date[_ + "Milliseconds"](),
                    o = utc ? 0 : date.getTimezoneOffset(),
                    flags = {
                        d: d,
                        dd: pad(d),
                        ddd: dF.i18n.dayNames[D],
                        dddd: dF.i18n.dayNames[D + 7],
                        m: m + 1,
                        mm: pad(m + 1),
                        mmm: dF.i18n.monthNames[m],
                        mmmm: dF.i18n.monthNames[m + 12],
                        yy: String(y).slice(2),
                        yyyy: y,
                        h: H % 12 || 12,
                        hh: pad(H % 12 || 12),
                        H: H,
                        HH: pad(H),
                        M: M,
                        MM: pad(M),
                        s: s,
                        ss: pad(s),
                        l: pad(L, 3),
                        L: pad(L > 99 ? Math.round(L / 10) : L),
                        t: H < 12 ? "a" : "p",
                        tt: H < 12 ? "am" : "pm",
                        T: H < 12 ? "A" : "P",
                        TT: H < 12 ? "AM" : "PM",
                        Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                        o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                        S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
                    };

                return mask.replace(token, function ($0) {
                    return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
                });
            };
        }();

        // Some common format strings
        dateFormat.masks = {
            //"default": "ddd mmm dd yyyy HH:MM:ss",
            "default": "yyyy-mm-dd HH:MM",
            shortDate: "yyyy-mm-dd",
            mediumDate: "mmm d, yyyy",
            longDate: "mmmm d, yyyy",
            fullDate: "dddd, mmmm d, yyyy",
            shortTime: "h:MM TT",
            mediumTime: "h:MM:ss TT",
            longTime: "h:MM:ss TT Z",
            isoDate: "yyyy-mm-dd",
            isoTime: "HH:MM:ss",
            isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
            isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
        };

        // Internationalization strings
        dateFormat.i18n = {
            dayNames: [
                "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
                "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
            ],
            monthNames: [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
            ]
        }

        // For convenience...
        Date.prototype.formatDate = function (mask, utc) {
            return dateFormat(this, mask, utc);
        }


        var queryString = (function () {
            var urlParams = {};
            var e,
                a = /\+/g, // Regex for replacing addition symbol with a space
                r = /([^&=]+)=?([^&]*)/g,
                d = function (s) {
                    return decodeURIComponent(s.replace(a, " "));
                },
                q = window.location.search.substring(1);

            while (e = r.exec(q))
                urlParams[d(e[1])] = d(e[2]);

            return urlParams;
        })();

        function concatUrl(base, url) {
            if (Akmii.Utility.isNullorEmpty(base))
                return url;

            if (Akmii.Utility.isNullorEmpty(url))
                return base;

            if (base.charAt(base.length - 1) == "/") {
                if (url.charAt(0) == "/")
                    return base + url.substring(1);
                else
                    return base + url;
            } else {
                if (url.charAt(0) == "/")
                    return base + url;
                else
                    return base + "/" + url;
            }
        }

        Akmii.defineNS(namespace, {
            queryString: queryString,

            formatDate: dateFormat,

            isNullorEmpty: function (str) {
                return str == null || $.trim(str).length == 0;
            },

            strEllipsis: function (str, n) {
                var ilen = str.length;
                if (ilen * 2 <= n) return str;
                n -= 3;
                var i = 0;
                while (i < ilen && n > 0) {
                    if (escape(str.charAt(i)).length > 4) n--;
                    n--;
                    i++;
                }
                if (n > 0) return str;
                return str.substring(0, i) + "...";
            },

            dateFromService: function (d) {
                return eval("new " + d.slice(1, -1));
            },

            XMLToString: function (oXML) {
                if (window.ActiveXObject) {
                    return oXML.xml;
                } else {
                    return (new XMLSerializer()).serializeToString(oXML);
                }
            },

            XMLFromString: function (sXML) {
                if (window.ActiveXObject) {
                    var oXML = new ActiveXObject("Microsoft.XMLDOM");
                    oXML.loadXML(sXML);
                    return oXML;
                } else {
                    return (new DOMParser()).parseFromString(sXML, "text/xml");
                }
            },

            isUrl: function (str) {
                if (this.isNullorEmpty(str))
                    return false;

                //var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
                var expression = "[a-zA-z]+://[^\s]*";
                var regex = new RegExp(expression);
                return str.match(regex);
            },
            json2str: function (obj) {
                return JSON ? JSON.stringify(obj) : this.obj2str(obj);
            },
            obj2str: function (o) {
                if (o == null)
                    return "\"\"";
                var r = [];
                if (typeof o == "string") return "\"" + o.replace(/([\'\"\\])/g, "\\$1").replace(/(\n)/g, "\\n").replace(/(\r)/g, "\\r").replace(/(\t)/g, "\\t") + "\"";
                if (o instanceof Date) return "\"\\\/Date(" + o.getTime() + ")\\\/\"";
                if (typeof o == "object") {
                    if (!o.sort) {
                        for (var i in o)
                            r.push("\"" + i + "\":" + obj2str(o[i]));
                        if (!!document.all && !/^\n?function\s*toString\(\)\s*\{\n?\s*\[native code\]\n?\s*\}\n?\s*$/.test(o.toString)) {
                            r.push("toString:" + o.toString.toString());
                        }
                        r = "{" + r.join() + "}"
                    } else {
                        for (var i = 0; i < o.length; i++)
                            r.push(obj2str(o[i]))
                        r = "[" + r.join() + "]"
                    }
                    return r;
                }
                return o.toString();
            },
            concatUrl: function (urls) {
                var url = "";
                if (!arguments || arguments.length == 0) {

                } else {
                    for (var i = 0; i < arguments.length; i++) {
                        url = concatUrl(url, arguments[i]);
                    }
                }
                return url;
            },

            newGuid: function () {
                return uuid();
            },

            koApplyLables: function (obj, resource) {
                for (var d in resource) {
                    obj['Label' + d] = resource[d];
                }
            },
            koWrapUserField: function (obj, field) {
                obj[field + "_Value"] = ko.computed({
                    read: function () {
                        var value = "";
                        if (obj[field]()) {
                            value = obj[field]().get_lookupValue();
                        }
                        return value;
                    },
                    write: function (value) {
                        if (Akmii.Utility.isNullorEmpty(value)) {
                            obj[field](null);
                        } else
                            obj[field](SP.FieldUserValue.fromUser(value));
                    }

                });
            },
            koWrapUserCollectionField: function (obj, field) {
                obj[field + "_Value"] = ko.computed({
                    read: function () {
                        var value = "";
                        if (obj[field]() && obj[field]().length > 0) {
                            for (var i = 0; i < obj[field]().length; i++) {
                                value += obj[field]()[i].get_lookupValue() + ";";
                            }
                        }
                        return value;
                    },
                    write: function (value) {
                        if (Akmii.Utility.isNullorEmpty(value)) {
                            obj[field](null);
                        } else {
                            var arr = [];
                            var ulist = value.split(";");
                            for (var i = 0; i < ulist.length; i++) {
                                if (!Akmii.Utility.isNullorEmpty(ulist[i])) {
                                    arr.push(SP.FieldUserValue.fromUser(ulist[i]));
                                }
                            }
                            obj[field](arr);
                        }
                    }

                });
            },
            koWrapDateField: function (obj, field, format) {
                obj[field + "_Value"] = ko.computed({
                    read: function () {
                        var value = "";
                        if (obj[field]()) {
                            value = obj[field]().formatDate(format);
                        }
                        return value;
                    },
                    write: function (value) {
                        if (Akmii.Utility.isNullorEmpty(value)) {
                            obj[field](null);
                        } else
                            obj[field](Date.parse(value));
                    }

                });
            },
            koWrapDefaultFields: function (obj) {
                if (obj['Author']) {
                    Akmii.Utility.koWrapUserField(obj, 'Author');
                    Akmii.Utility.koWrapUserField(obj, 'Editor');
                    Akmii.Utility.koWrapDateField(obj, 'Created');
                    Akmii.Utility.koWrapDateField(obj, 'Modified');
                }
            },
            list2dict: function (list, key) {
                var dict = {};
                for (var i = 0; i < list.length; i++) {
                    var obj = list[i];
                    if (typeof (obj[key]) == 'function') {
                        dict[obj[key]()] = obj;
                    } else {
                        dict[obj[key]] = obj;
                    }
                }
                return dict;
            }
        });
    })("Akmii.Utility");

    (function (namespace) {

        var ctx = Akmii.define(function (context) {
            this.context = context;
            this.web = null;
        }, {
                execute: function () {
                    var dtd = $.Deferred();
                    self.context.executeQueryAsync(
                        Function.createDelegate(this, function () {
                            dtd.resolve();
                        }),
                        Function.createDelegate(this, function (sender, args) {
                            dtd.reject(sender, args);
                        })
                    );
                    return dtd.promise();
                },
                load: function (obj) {
                    var self = this;
                    var dtd = $.Deferred();

                    self.context.load(obj);
                    self.context.executeQueryAsync(
                        Function.createDelegate(this, function () {
                            dtd.resolve(obj);
                        }),
                        Function.createDelegate(this, function (sender, args) {
                            dtd.reject(sender, args);
                        })
                    );

                    return dtd.promise();
                },

                loadWeb: function (force) {

                    var self = this;
                    var dtd = $.Deferred();
                    if (self.web && !force) {
                        dtd.resolve(self.web);
                    } else {
                        self.load(self.web ? self.web : self.context.get_web()).then(function (web) {
                            self.web = web;
                            dtd.resolve(self.web);
                        }, function () {
                            dtd.reject();
                        });
                    }
                    return dtd.promise();
                },

                setMasterPage: function (url, check) {
                    var self = this;
                    var dtd = $.Deferred();
                    self.loadWeb().done(function (web) {

                        if (check) {
                            if (web.get_masterUrl() == url) {
                                dtd.resolve(false);
                            }
                        }

                        web.set_masterUrl(url);
                        web.update();
                        self.loadWeb(true).then(function () {
                            dtd.resolve(true);
                        }, function () {
                            dtd.reject();
                        });
                    });

                    return dtd.promise();
                },
                getContentTypeById: function (id) {
                    var self = this;
                    var dtd = $.Deferred();
                    self.loadWeb().done(function (web) {
                        self.load(web.get_contentTypes().getById(id)).done(function (type) {
                            dtd.resolve(type);
                        }).fail(function () {
                            dtd.reject()
                        });
                    });
                    return dtd.promise();
                },
                setFormOfContentType: function (id, newForm, editForm, displayForm) {
                    var self = this;
                    var dtd = $.Deferred();

                    self.getContentTypeById(id).done(function (type) {
                        var changed = false;

                        if (newForm) {
                            var old = type.get_newFormUrl();
                            if (Akmii.Utility.isNullorEmpty(old) || old != newForm) {
                                type.set_newFormUrl(newForm);
                                changed = true;
                            }
                        }
                        if (editForm) {
                            var old = type.get_editFormUrl();
                            if (Akmii.Utility.isNullorEmpty(old) || old != editForm) {
                                type.set_editFormUrl(editForm);
                                changed = true;
                            }
                        }
                        if (displayForm) {
                            var old = type.get_displayFormUrl();
                            if (Akmii.Utility.isNullorEmpty(old) || old != displayForm) {
                                type.set_displayFormUrl(displayForm);
                                changed = true;
                            }
                        }
                        if (changed) {
                            type.update(true);
                            self.load(type).done(function () {
                                dtd.resolve(true);
                            });
                        } else {
                            dtd.resolve(false);
                        }
                    }).fail(function () {
                        dtd.reject();
                    });
                    return dtd.promise();
                },
                getListByTitle: function (title) {
                    return this.load(this.context.get_web().get_lists().getByTitle(title));
                },
                getListById: function (id) {
                    return this.load(this.context.get_web().get_lists().getById(id));
                }
            }, {

            });

        var workflow = Akmii.define(function (akCtx) {
            this.akCtx = akCtx;
            this.workflowService = null;
            this.workflowInstanceService = null;
        }, {
                loadService: function () {
                    var dtd = $.Deferred();
                    var self = this;
                    if (this.workflowService) {
                        dtd.resolve(self.workflowService);
                    } else {
                        self.akCtx.loadWeb().done(function (web) {
                            self.akCtx.load(new SP.WorkflowServices.WorkflowServicesManager.newObject(self.akCtx.context, web))
                                .done(function (wsm) {
                                    self.workflowService = wsm;
                                    dtd.resolve(self.workflowService);
                                });
                        });
                    }
                    return dtd.promise();
                },
                loadInstanceService: function () {
                    var dtd = $.Deferred();
                    var self = this;
                    if (this.workflowInstanceService) {
                        dtd.resolve(self.workflowInstanceService);
                    } else {
                        self.loadService().done(function (service) {
                            self.akCtx.load(service.getWorkflowInstanceService()).done(function (instance) {
                                self.workflowInstanceService = instance;
                                dtd.resolve(self.workflowInstanceService);
                            });
                        });
                    }
                    return dtd.promise();
                },
                getWorkflowInstances: function (listId, itemId) {
                    var self = this;
                    var wfManager = SP.WorkflowServices.WorkflowServicesManager.newObject(self.akCtx.context, self.akCtx.context.get_web());
                    var instance = wfManager.getWorkflowInstanceService();
                    return self.akCtx.load(instance.enumerateInstancesForListItem(listId, itemId));
                }
                //,getWorkflowTasks: function (instance) {
                //    var self = this;
                //    var dtd = $.Deferred();
                //    var props = instance.get_properties();
                //    var instanceId = instance.get_id();
                //    var listId = props["Microsoft.SharePoint.ActivationProperties.ContextListId"];
                //    var list = this.akCtx.context.get_web().get_lists().getById(listId);
                //    var lists = {};
                //    this.akCtx.load(list.get_workflowAssociations()).done(function (ass) {
                //        var enu = ass.getEnumerator();
                //        while (enu.moveNext()) {
                //            var as = enu.get_current();
                //            list[as.get_taskListTitle()] = as.get_taskListTitle();
                //        }

                //        var defers = [];
                //        for (title in lists) {
                //            var camlQuery = new SP.CamlQuery();
                //            camlQuery.set_viewXml(
                //                '<View><Query><Where><Eq><FieldRef Name=\'WorkflowInstanceID\'/>' +
                //                '<Value Type=\'Guid\'>' + instanceId + '</Value></Eq></Where></Query>' +
                //                '</View>'
                //            );
                //            defers.push(self.akCtx.context.get_web().get_lists().getByTitle(title).getItems(camlQuery));
                //        }
                //        $.when.apply(null, defers).done(function () {
                //            var items = [];
                //            for (var i in arguments) {
                //                var enu = arguments[i].getEnumerator();
                //                while (enu.moveNext()) {
                //                    var item = enu.get_current();
                //                    items.push(item);
                //                }
                //            }
                //            dtd.resolve(items);
                //        });
                //    });

                //    return dtd.promise();
                //}
            }, {
                instancePropertyContextListId: "Microsoft.SharePoint.ActivationProperties.ContextListId",
                instancePropertyCurrentItemUrl: "Microsoft.SharePoint.ActivationProperties.CurrentItemUrl",
                instancePropertyInitiatorUserId: "Microsoft.SharePoint.ActivationProperties.InitiatorUserId",
                instancePropertyItemGuid: "Microsoft.SharePoint.ActivationProperties.ItemGuid",
                instancePropertyItemId: "Microsoft.SharePoint.ActivationProperties.ItemId",
                instancePropertyRetryCode: "Microsoft.SharePoint.ActivationProperties.RetryCode"
            });

        Akmii.defineNS(namespace, {
            Context: ctx,
            Workflow: workflow
        });

    })("Akmii");


    (function (namespace) {
        var _currentSite = "";
        var SOAPEnvelope = {};
        SOAPEnvelope.header = "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'><soap:Body>";
        SOAPEnvelope.footer = "</soap:Body></soap:Envelope>";

        function getCurrentSite() {
            if (_currentSite.length > 0) {
                return _currentSite;
            }

            var msg = SOAPEnvelope.header +
                "<WebUrlFromPageUrl xmlns='http://schemas.microsoft.com/sharepoint/soap/' ><pageUrl>" +
                ((location.href.indexOf("?") > 0) ? location.href.substr(0, location.href.indexOf("?")) : location.href) +
                "</pageUrl></WebUrlFromPageUrl>" +
                SOAPEnvelope.footer;
            $.ajax({
                async: false,
                url: "/_vti_bin/Webs.asmx",
                type: "POST",
                data: msg,
                dataType: "xml",
                contentType: "text/xml;charset=\"utf-8\"",
                complete: function (xData, Status) {
                    _currentSite = $(xData.responseXML).find("WebUrlFromPageUrlResult").text();
                }
            });
            return _currentSite;
        }

        function callWebService(service, message) {
            var dtd = $.Deferred();
            var site = getCurrentSite();

            var result = '';

            var message = SOAPEnvelope.header +
                message +
                SOAPEnvelope.footer;

            $.ajax({
                url: site + "/_vti_bin/" + service + ".asmx",
                type: "POST",
                data: message,
                //dataType: ($.browser.msie) ? "text" : "xml",  
                dataType: "xml",
                contentType: "text/xml;charset=\"utf-8\""
            }).then(function (d) {
                dtd.resolve(d);
                //result = $().GetXmlObject(d.responseText);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                Akmii.UI.ajaxError(jqXHR, textStatus, errorThrown);
                dtd.reject(jqXHR, textStatus, errorThrown);
            });
            return dtd.promise();
        }

        function getSiteUrl(url) {
            return Akmii.Utility.concatUrl(getCurrentSite(), url);
        }

        function callJSON(method, data, type, siteUrl) {
            var options = {
                contentType: 'application/json',
                dataType: 'json'
            };
            if (typeof method === 'object') {
                $.extend(options, method);
            } else {
                var site = siteUrl || getCurrentSite();
                $.extend(options, {
                    url: Akmii.Utility.concatUrl(site, method),
                    data: Akmii.Utility.json2str(data),
                    type: type
                });
            }
            return $.ajax(options);
        }

        function getAPIUrl(siteUrl, method) {
            var url = siteUrl || getCurrentSite();
            return Akmii.Utility.concatUrl(url, "/_api/", method);
        }

        function ajaxGet(options) {
            var url = options.url;
            if (url.indexOf('?') < 0) {
                url += '?';
            }
            url += '&random=' + (new Date()).getTime();
            return $.ajax(options);
        }


        function APIGet(method, data, siteUrl, headers) {
            var options = {
                contentType: 'application/json',
                dataType: 'json',
                headers: $.extend({
                    'accept': "application/json;odata=verbose"
                }, headers),
                type: 'GET'
            }

            if (typeof method === 'object') {
                $.extend(options, method);
            } else {
                $.extend(options, {
                    url: getAPIUrl(siteUrl, method),
                    data: data ? Akmii.Utility.json2str(data) : null
                });
            }
            return ajaxGet(options);
        }

        function getWCFAPIUrl(siteUrl, method) {
            var url = siteUrl || getCurrentSite();
            return Akmii.Utility.concatUrl(url, "/_vti_bin/listdata.svc/", method);
        }

        function APIWCFGetJson(method, data, siteUrl, headers) {
            var options = {
                contentType: 'application/json',
                dataType: 'json',
                headers: $.extend({
                    'accept': "application/json;odata=verbose"
                }, headers),
                type: 'GET'
            }

            if (typeof method === 'object') {
                $.extend(options, method);
            } else {
                $.extend(options, {
                    url: getWCFAPIUrl(siteUrl, method),
                    data: data ? Akmii.Utility.json2str(data) : null
                });
            }
            return ajaxGet(options);
        }

        function APIGetHttpContent(method, data, siteUrl, headers) {
            var options = {
                contentType: 'text/xml;charset="utf-8"',
                dataType: 'json',
                cache: false,
                type: 'GET'
            }

            if (typeof method === 'object') {
                $.extend(options, method);
            } else {
                $.extend(options, {
                    url: getWCFAPIUrl(siteUrl, method),
                    data: data ? Akmii.Utility.json2str(data) : null
                });
            }
            return ajaxGet(options);
        }


        function APIPostFile(method, data, siteUrl, httpMethod, etag) {
            var digest = $('#__REQUESTDIGEST').length > 0 ? $('#__REQUESTDIGEST').val() : getDigest();
            var options = {
                url: (siteUrl ? getAPIUrl(siteUrl, method) : method),
                type: 'POST',
                data: data,
                processData: false,
                headers: {
                    "accept": "application/json;odata=verbose",
                    "content-length": data.length,
                    'X-RequestDigest': digest,
                    "IF-MATCH": etag || '*',
                    'X-HTTP-Method': httpMethod || 'POST'
                }
            }
            return $.ajax(options);
        }

        function getDigest() {
            return "";
        }

        function APIPost(method, data, XHTTPMethod, etag, siteUrl, headers) {
            var digest = $('#__REQUESTDIGEST').length > 0 ? $('#__REQUESTDIGEST').val() : getDigest();
            var options = {
                type: 'POST',
                headers: $.extend({
                    "accept": "application/json;odata=verbose",
                    "content-type": "application/json;odata=verbose",
                    'X-RequestDigest': digest,
                    'IF-MATCH': etag || '*',
                    'X-HTTP-Method': XHTTPMethod || 'POST'
                }, headers)
            }

            if (typeof method === 'object') {
                $.extend(options, method);
            } else {
                $.extend(options, {
                    url: getAPIUrl(siteUrl, method),
                    data: data ? Akmii.Utility.json2str(data) : null
                });
            }
            return $.ajax(options);
        }


        //register res file to support localization in frontend
        //Sample:
        //Akmii.SP.regRes("Style Library/akmii/resources", "workflow").done(function () { alert(Akmii.Resource.workflow.WorkflowCenter) });
        function registerResource(path, resource, siteServerRelativeUrl) {
            var siteUrl = siteServerRelativeUrl || _spPageContextInfo.siteServerRelativeUrl;
            var dtd = $.Deferred();
            var defaultUrl = Akmii.Utility.concatUrl(siteUrl, path, resource + '.res');
            var lanUrl = Akmii.Utility.concatUrl(siteUrl, path, _spPageContextInfo.currentLanguage + "", resource + '.res');
            var resObject = {};

            function parseObj(str) {
                resObject = $.parseJSON(str);

                var ns = "Akmii.Resource." + resource;
                Akmii.defineNS(ns, resObject);

                dtd.resolve(resObject);
            }

            $.get(lanUrl).done(parseObj)
                .fail(function () {
                    $.get(defaultUrl).done(parseObj)
                        .fail(function () {
                            var error = "Resource " + resource + ".res could not be found!";
                            if (Akmii.UI.error) {
                                Akmii.UI.error(error);
                            }
                            dtd.reject(error);
                        });
                })

            return dtd.promise();
        }

        function initItem(list, obj, item, fields) {
            var spitem = item;
            if (!item) {
                spitem = Akmii.SP.addListItem(list);
            }

            initItemFields(obj, spitem, fields);

            obj._save = function () {
                var self = this;
                var dtd = $.Deferred();
                var item = this._item;
                Akmii.SP.setItemFields(this, item, fields);
                item.update();
                list.get_context().load(item);
                list.get_context().executeQueryAsync(function () {
                    setObjFields(self, item, fields);
                    dtd.resolve(self);
                }, function (sender, args) {
                    Akmii.UI.executeQueryError(sender, args);
                    dtd.reject();
                });

                return dtd.promise();
            }

            obj._delete = function () {
                var dtd = $.Deferred();
                var item = this._item;
                item.deleteObject();
                list.get_context().executeQueryAsync(function () {
                    dtd.resolve();
                }, function (sender, args) {
                    Akmii.UI.executeQueryError(sender, args);
                    dtd.reject();
                });

                return dtd.promise();
            }
        }

        function setObjFields(obj, item, fields) {
            if (item && item.get_id() != -1) {
                obj.ID(item.get_item("ID"));
                obj.Author(item.get_item("Author"));
                obj.Created(item.get_item("Created"));
                obj.Editor(item.get_item("Editor"));
                obj.Modified(item.get_item("Modified"));
                $.each(fields, function (i, d) {
                    try {
                        obj[d](item.get_item(d));
                    } catch (e) {
                        console.log(e);
                    }
                });
            }
        }

        function initItemFields(obj, item, fields) {
            obj._item = item;
            obj.ID = ko.observable();
            obj.Author = ko.observable();
            obj.Created = ko.observable();
            obj.Editor = ko.observable();
            obj.Modified = ko.observable();

            $.each(fields, function (i, d) {
                obj[d] = ko.observable();
            });

            setObjFields(obj, item, fields);
        }

        function setItemFields(obj, item, fields) {
            $.each(fields, function (i, d) {
                var value = obj[d]();
                if (value && typeof (value) == 'string') {
                    value = $.trim(value);
                }

                item.set_item(d, value);
            });
        }

        function queryById(list, id, fields, objClass) {
            var dtd = $.Deferred();

            var item = list.getItemById(id);
            list.get_context().load(item);

            list.get_context().executeQueryAsync(function () {
                if (objClass)
                    dtd.resolve(new objClass(list, item, fields));
                else
                    dtd.resolve(item);
            }, function (sender, args) {
                Akmii.UI.executeQueryError(sender, args);
                dtd.reject(sender, args);
            });


            /*
            var caml = "<View>";
            if (fields)
                caml += Akmii.SP.generateViewFields(fields)
            caml += "<Query><Where><Eq><FieldRef Name='ID'/><Value Type='Text'>" + id + "</Value></Eq></Where></Query></View>";
            var camlQuery = new SP.CamlQuery();
            camlQuery.set_viewXml(caml)
            
            var items = list.getItems(camlQuery);
            
            list.$0_0.load(items);

            list.$0_0.executeQueryAsync(function(){
                if (items.get_count()>0) {
                    dtd.resolve(items.getItemAtIndex(0));
                } else {
                    dtd.resolve(null);
                }
            }, function (sender, args) {
                dtd.reject(sender, args);
            });
            */
            return dtd.promise();
        }

        //
        /**
         * Search user by given text
         * @param text search text
         * @param max max result returned
         * @param type None or User or DistributionList or SecurityGroup or SharePointGroup or All
         */
        function searchUser(text, max, type) {
            var t = type || "User";
            var m = max || 20;
            var message = "<SearchPrincipals xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\">" +
                "<searchText>" + text + "</searchText>" +
                "<maxResults>" + m + "</maxResults>" +
                "<principalType>" + t + "</principalType></SearchPrincipals>";

            return callWebService("people", message);
        }

        function searchUserWCF(text, max, type) {
            var dtd = $.Deferred();
            var context = new SP.ClientContext();
            var query = new SP.UI.ApplicationPages.ClientPeoplePickerQueryParameters();
            query.set_allowMultipleEntities(false);
            query.set_maximumEntitySuggestions(50);
            query.set_principalType(1);
            query.set_principalSource(15);
            query.set_queryString(text);
            var searchResult = SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.clientPeoplePickerSearchUser(context, query);
            context.executeQueryAsync(function () {
                var results = context.parseObjectFromJsonString(searchResult.get_value());
                dtd.resolve(searchResult.get_value());
                var txtResults = '';
            }, function (sender, args) {
                Akmii.UI.executeQueryError(sender, args);
                //alert('Error message:' + args.get_message() + 'Error code:' + args.get_errorCode() + 'Error details:' + args.get_errorDetails() + 'Error stackTrace:' + args.get_stackTrace());
            });
            return dtd.promise();
        }

        function searchAllUser(uName) {
            //var message = "<GetAllUserCollectionFromWeb xmlns=\"http://schemas.microsoft.com/sharepoint/soap/directory/\" />";
            //return callWebServiceByRoot("usergroup", message);
            // var message = '<Request xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="Javascript Library"><Actions><StaticMethod TypeId="{de2db963-8bab-4fb4-8a58-611aebc5254b}" Name="ClientPeoplePickerSearchUser" Id="4"><Parameters><Parameter TypeId="{ac9358c6-e9b1-4514-bf6e-106acbfb19ce}"><Property Name="AllowEmailAddresses" Type="Boolean">false</Property><Property Name="AllowMultipleEntities" Type="Boolean">true</Property><Property Name="AllowOnlyEmailAddresses" Type="Boolean">false</Property><Property Name="AllUrlZones" Type="Boolean">false</Property><Property Name="EnabledClaimProviders" Type="String"></Property><Property Name="ForceClaims" Type="Boolean">false</Property><Property Name="MaximumEntitySuggestions" Type="Number">30</Property><Property Name="PrincipalSource" Type="Number">15</Property><Property Name="PrincipalType" Type="Number">13</Property><Property Name="QueryString" Type="String">' + uName + '</Property><Property Name="Required" Type="Boolean">true</Property><Property Name="SharePointGroupID" Type="Number">0</Property><Property Name="UrlZone" Type="Number">0</Property><Property Name="UrlZoneSpecified" Type="Boolean">false</Property><Property Name="Web" Type="Null" /><Property Name="WebApplicationID" Type="String">{00000000-0000-0000-0000-000000000000}</Property></Parameter></Parameters></StaticMethod></Actions><ObjectPaths /></Request>';
            //var clientContext = new SP.ClientContext("https://akmiihk.sharepoint.com/sites/WorkFlowCenter");
            //var web = clientContext.get_web();

            //var users = web.get_siteUsers();
            //clientContext.load(users);
            //clientContext.executeQueryAsync(
            //function () {
            //    for (var i = 0; i < users.get_count() ; i++) {
            //        var user = users.getItemAtIndex(i);
            //        //var personBirthday = peopleManager.getUserProfilePropertyFor(user.get_loginName(), 'SPS-Birthday');
            //        //personsProperties.push(personBirthday);
            //        console.log(user.get_loginName());
            //    }
            //});
            var dtd = $.Deferred();
            var context = new SP.ClientContext.get_current();
            var web = context.get_web();
            var user = web.get_siteUsers().getByEmail(uName);

            context.load(user);
            context.executeQueryAsync(function () {
                dtd.resolve(user);
            });
            return dtd.promise();
        }

        function callWebServiceByRoot(service, message) {
            var dtd = $.Deferred();
            var site = getCurrentSite();

            var result = '';

            var message = SOAPEnvelope.header +
                message +
                SOAPEnvelope.footer;

            $.ajax({
                url: _spPageContextInfo.siteAbsoluteUrl.replace(_spPageContextInfo.siteServerRelativeUrl, "") + "/_vti_bin/" + service + ".asmx",
                type: "POST",
                data: message,
                //dataType: ($.browser.msie) ? "text" : "xml",  
                dataType: "xml",
                contentType: "text/xml;charset=\"utf-8\""
            }).then(function (d) {
                dtd.resolve(d);
                //result = $().GetXmlObject(d.responseText);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                Akmii.UI.ajaxError(jqXHR, textStatus, errorThrown);
                dtd.reject(jqXHR, textStatus, errorThrown);
            });
            return dtd.promise();
        }

        function resolvePrincipals(emailsorlogins, type, addToUserInfoList) {
            if (emailsorlogins) {
                if (emailsorlogins.length > 0) {
                    var t = type || "User";
                    var add = addToUserInfoList ? "True" : "False";

                    var message = "<ResolvePrincipals xmlns=\"http://schemas.microsoft.com/sharepoint/soap/\"><principalKeys>";
                    for (var i = 0; i < emailsorlogins.length; i++) {
                        message += "<string>" + emailsorlogins[i] + "</string>";
                    }
                    message += "</principalKeys>" +
                        "<principalType>" + t + "</principalType>" +
                        "<addToUserInfoList>" + add + "</addToUserInfoList></ResolvePrincipals>";

                    return callWebService("people", message);
                }
            }
        }

        function GetAllUserCollection(loginName) {
            var message = ' <GetUserCollection xmlns="http://schemas.microsoft.com/sharepoint/soap/directory/">' +
                '<userLoginNamesXml>string</userLoginNamesXml>' +
                '</GetUserCollection>';
            return callWebService("usergroup", message)
        }

        function getUserProfileByAccount(account) {
            var message = "<GetUserProfileByName xmlns=\"http://microsoft.com/webservices/SharePointPortalServer/UserProfileService\">" +
                "<AccountName>" + account + "</AccountName></GetUserProfileByName>";
            return callWebService("UserProfileService", message);
        }

        function addTagContent(caml, tag, parentTag, content) {
            var result = caml;
            var tagStart = "<" + tag + ">";
            var tagEnd = "</" + tag + ">";
            var parent = "<" + parentTag + ">";
            var pos = caml.indexOf(tagStart);
            if (pos > 0) {
                var lpos = caml.indexOf(tagEnd);
                result = caml.substring(0, pos + tagStart.length) + content + caml.substring(lpos);
            } else {
                pos = caml.indexOf(parent);
                result = caml.substring(0, pos + parent.length) + tagStart + content + tagEnd + caml.substring(pos + parent.length);
            }

            return result;
        }

        function addRowLimit(caml, limit) {
            return addTagContent(caml, "RowLimit", "View", limit);
        }

        function hasItems(list, query) {
            var dtd = $.Deferred();

            var caml = Akmii.SP.Caml.BuildView(["ID"], query, null, null, true);
            var camlQuery = new SP.CamlQuery();
            camlQuery.set_viewXml(caml)

            var items = list.getItems(camlQuery);

            list.get_context().load(items);

            list.get_context().executeQueryAsync(function () {
                if (items.get_count() > 0) {
                    dtd.resolve(true);
                } else {
                    dtd.resolve(false);
                }
            }, function (sender, args) {
                Akmii.UI.executeQueryError(sender, args);
                dtd.reject(sender, args);
            });
            return dtd.promise();
        }

        function queryItems(list, caml) {
            var dtd = $.Deferred();
            var camlQuery = new SP.CamlQuery();
            camlQuery.set_viewXml(caml)
            var items = list.getItems(camlQuery);
            list.get_context().load(items);
            list.get_context().executeQueryAsync(function () {
                dtd.resolve(items);
            }, function (sender, args) {
                Akmii.UI.executeQueryError(sender, args);
                dtd.reject(sender, args);
            });
            return dtd.promise();
        }

        function querySingleItem(list, caml, objClass, fields) {
            var dtd = $.Deferred();
            queryItems(list, caml).then(function (items) {
                if (items.get_count() > 0) {
                    var result = items.getItemAtIndex(0);

                    if (objClass) {
                        result = new objClass(list, result, fields);
                    }
                    dtd.resolve(result);
                } else {
                    dtd.resolve(null);
                }
            }).fail(function (sender, args) {
                dtd.reject(sender, args);
            })
            return dtd.promise();
        }

        function queryItemsArray(list, caml, objClass, fields) {
            var dtd = $.Deferred();
            queryItems(list, caml).then(function (d) {
                var itemArr = [];
                var listItemEnumerator = d.getEnumerator();
                while (listItemEnumerator.moveNext()) {
                    var obj = new objClass(list, listItemEnumerator.get_current(), fields);
                    itemArr.push(obj);
                }
                dtd.resolve(itemArr);
            }).fail(function (sender, args) {
                dtd.reject(sender, args);
            })
            return dtd.promise();
        }

        function queryItemsPagingArray(list, caml, page, limit, extralLine, objClass, fields) {
            var dtd = $.Deferred();
            queryItemsPaging(list, caml, page, limit, extralLine).then(function (d) {
                var itemArr = [];
                var listItemEnumerator = d.getEnumerator();
                while (listItemEnumerator.moveNext()) {
                    var obj = new objClass(list, listItemEnumerator.get_current(), fields);
                    itemArr.push(obj);
                }
                dtd.resolve(itemArr);
            }).fail(function (sender, args) {
                dtd.reject(sender, args);
            })
            return dtd.promise();
        }

        function queryItemsPaging(list, caml, page, limit, extralLine) {
            var dtd = $.Deferred();
            var li = limit;
            if (extralLine)
                li++;
            var camlFinal = addRowLimit(caml, li);

            var query = new SP.CamlQuery();
            query.set_viewXml(camlFinal);

            if (page > 1) {
                var queryLast = new SP.CamlQuery();
                var camlLast = addTagContent(caml, 'ViewFields', 'View', Akmii.SP.Caml.MinimalViewFields());

                var rowLimit = limit * (page - 1);
                camlLast = addRowLimit(camlLast, rowLimit);

                queryLast.set_viewXml(camlLast);

                var items = list.getItems(queryLast);

                list.get_context().load(items);

                list.get_context().executeQueryAsync(function () {

                    /*
                    var count = items.get_count();
                    if (count >= limit) {
                        var lastPos = count - 1;
                        var previousPagingInfo = "Paged=TRUE&p_ID=" + items.itemAt(lastPos).get_item('ID');
                        var position = new SP.ListItemCollectionPosition();
                        position.set_pagingInfo(previousPagingInfo);
                        query.set_listItemCollectionPosition(position);
                    }
                    */
                    query.set_listItemCollectionPosition(items.get_listItemCollectionPosition());

                    var results = list.getItems(query);
                    list.get_context().load(results);
                    list.get_context().executeQueryAsync(function () {
                        dtd.resolve(results);
                    }, function (sender, args) {
                        Akmii.UI.executeQueryError(sender, args);
                        dtd.reject(sender, args);
                    });
                }, function (sender, args) {
                    Akmii.UI.executeQueryError(sender, args);
                    dtd.reject(sender, args);
                });
            } else {
                var results = list.getItems(query);
                list.get_context().load(results);
                list.get_context().executeQueryAsync(function () {
                    dtd.resolve(results);
                }, function (sender, args) {
                    Akmii.UI.executeQueryError(sender, args);
                    dtd.reject(sender, args);
                });
            }
            return dtd.promise();
        }


        /*
        get field and cast to specific type
        @type FieldCalculated
                FieldChoice
                FieldComputed
                FieldCurrency
                FieldDateTime
                FieldLink
                FieldLinkCollection
                FieldLookup
                FieldMultiChoice
                FieldMultiLineText
                FieldNumber
                FieldRatingScale
                FieldText
                FieldUrl
                FieldUser
        */
        function getField(list, internalNameOrTitle, type) {
            var dtd = $.Deferred();
            var field = list.get_context().castTo(list.get_fields().getByInternalNameOrTitle(internalNameOrTitle), type);
            list.get_context().load(field);
            list.get_context().executeQueryAsync(function () {
                dtd.resolve(field);
            }, function (sender, args) {
                Akmii.UI.executeQueryError(sender, args);
                dtd.reject(sender, args);
            });

            return dtd.promise();
        }

        function getFieldChoices(list, internalNameOrTitle) {
            var dtd = $.Deferred();
            getField(list, internalNameOrTitle, SP.FieldChoice).then(function (field) {
                dtd.resolve(field.get_choices());
            }).fail(function (sender, args) {
                dtd.reject(sender, args);
            });

            return dtd.promise();
        }

        Akmii.defineNS(namespace, {
            regRes: registerResource,
            currentSiteUrl: getCurrentSite,
            currentSiteRelatedUrl: getSiteUrl,
            apiUrl: getAPIUrl,
            getJSON: function (method, data, siteUrl) {
                var site = siteUrl || getCurrentSite();
                return $.getJSON(Akmii.Utility.concatUrl(site, method), data);
            },
            putJSON: function (method, data, siteUrl) {
                return callJSON(method, data, 'PUT', siteUrl);
            },
            deleteJSON: function (method, data, siteUrl) {
                return callJSON(method, data, 'DELETE', siteUrl);
            },
            postJSON: function (method, data, siteUrl) {
                return callJSON(method, data, 'POST', siteUrl);
            },
            UploadTheFileToDefaultFolder: function () {
                var dtd = $.Deferred();
                var thisGUID = Ben.JSHelper.CreateGUID();

                Akmii.SP.CreatedFolder(thisGUID).then(function (data, listGuid) {
                    Akmii.SP.UploadFile(data, listGuid).then(function (data, fileName) {


                        dtd.resolve(data, fileName)
                    });
                });
                return dtd.promise();
            },
            uploadFileListSync: function (File, maskId, Extends, library) {
                if (!maskId)
                    maskId = "#fileList";
                var filename = new Date().formatDate("yyyymmddHHMMssl") + "-.-" + File.name;
                var file = File;
                if (!library)
                    library = _spPageContextInfo.currentCultureName == "en-US" ? "Documents" : "文档";

                if (!Akmii.Utility.isNullorEmpty(Extends) && Extends.toLowerCase().indexOf(filename.substring(filename.lastIndexOf(".")).toLowerCase()) < 0) {
                    Akmii.UI.warning("File extension should be \"" + Extends + "\".");
                    return;
                }

                //$("#" + maskId).mask("Uploading...");

                var deferred = $.Deferred();

                var reader = new FileReader();
                reader.onloadend = function (evt) {
                    if (evt.target.readyState == FileReader.DONE) {
                        var buffer = evt.target.result;
                        var completeUrl = _spPageContextInfo.webAbsoluteUrl +
                            "/_api/web/lists/getByTitle('" + library + "')" +
                            "/RootFolder/Files/add(url='" + filename + "',overwrite='true')?" +
                            "@TargetLibrary='" + library + "'&@TargetFileName='" + filename + "'";

                        $.ajax({
                            url: completeUrl,
                            type: "POST",
                            data: buffer,
                            async: false,
                            processData: false,
                            headers: {
                                "accept": "application/json;odata=verbose",
                                "X-RequestDigest": $("#__REQUESTDIGEST").val()
                            },
                            complete: function (data) {
                                if (data) {
                                    var entry = $.parseJSON(data.responseText).d;
                                    deferred.resolve(entry);
                                }
                                $("#" + maskId).unmask();
                            },
                            error: function (err) {
                                alert('Upload failed');
                                //console.log(err);
                                deferred.reject(err);
                                $("#" + maskId).unmask();
                            }

                        });

                    }
                };
                reader.readAsArrayBuffer(file);

                return deferred.promise();
            },
            uploadFileSync: function (fileId, maskId, Extends, library) {
                if (document.getElementById(fileId).files.length === 0) {
                    //alert('No file was selected');
                    Akmii.UI.warning("No file was selected.");
                    return;
                }

                if (!maskId)
                    maskId = "#fileList";
                var parts = document.getElementById(fileId).value.split("\\");
                var filename = new Date().formatDate("yyyymmddHHMMssl") + "-.-" + parts[parts.length - 1];
                var file = document.getElementById(fileId).files[0];
                if (!library)
                    library = "ImagesFiles";

                if (!Akmii.Utility.isNullorEmpty(Extends) && Extends.toLowerCase().indexOf(filename.substring(filename.lastIndexOf(".")).toLowerCase()) < 0) {
                    Akmii.UI.warning("文件类型不是以下类型 \"" + Extends + "\".");
                    return;
                }

                $(maskId).mask("Uploading...");

                var deferred = $.Deferred();

                var reader = new FileReader();
                reader.onloadend = function (evt) {
                    if (evt.target.readyState == FileReader.DONE) {
                        var buffer = evt.target.result;
                        var completeUrl = _spPageContextInfo.webAbsoluteUrl +
                            "/_api/web/lists/getByTitle('" + library + "')" +
                            "/RootFolder/Files/add(url='" + filename + "',overwrite='true')?" +
                            "@TargetLibrary='" + library + "'&@TargetFileName='" + filename + "'";

                        $.ajax({
                            url: completeUrl,
                            type: "POST",
                            data: buffer,
                            async: true,
                            processData: false,
                            headers: {
                                "accept": "application/json;odata=verbose",
                                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                                "content-length": buffer.byteLength
                            },
                            complete: function (data) {
                                // console.log(data.responseJSON.d.ServerRelativeUrl);
                                if (data.responseJSON) {
                                    //deferred.resolve(data.responseJSON.d.Name.split("-.-")[1], _spPageContextInfo.siteAbsoluteUrl.replace(_spPageContextInfo.siteServerRelativeUrl, "") + data.responseJSON.d.ServerRelativeUrl);
                                    deferred.resolve(data.responseJSON.d.Name.split("-.-")[1], _spPageContextInfo.siteAbsoluteUrl + data.responseJSON.d.ServerRelativeUrl);

                                } else {
                                    var entry = $.parseJSON(data.responseText).d;
                                    deferred.resolve(entry.Name.split("-.-")[1], _spPageContextInfo.siteAbsoluteUrl + entry.ServerRelativeUrl);
                                }
                                $(maskId).unmask();
                            },
                            error: function (err) {
                                alert('Upload failed');
                                //console.log(err);
                                deferred.reject(err);
                                $(maskId).unmask();
                            }
                        });

                    }
                };
                reader.readAsArrayBuffer(file);

                return deferred.promise();
            },
            UploadImageToDataUrl: function (fileId) {
                if (document.getElementById(fileId).files.length === 0) {
                    Akmii.UI.warning("No file was selected.");
                    return;
                }
                var file = document.getElementById(fileId).files[0];
                if (!/image\/\w+/.test(file.type)) {
                    alert("请确保文件为图像类型");
                    return false;
                }
                var deferred = $.Deferred();

                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = function (e) {
                    deferred.resolve(e.target.result);
                };
                return deferred.promise();
            },
            CreatedFolder: function (thisGUID, folderName) {
                var dtd = $.Deferred();
                var clientContext;
                var oWebsite;
                var oList;
                var itemCreateInfo;
                clientContext = new SP.ClientContext.get_current(); //获取上下文对象
                oWebsite = clientContext.get_web(); //获取当前网站对象
                oList = oWebsite.get_lists().getByTitle(folderName || "Documents"); //获取文档库列表

                itemCreateInfo = new SP.ListItemCreationInformation();
                itemCreateInfo.set_underlyingObjectType(SP.FileSystemObjectType.folder);

                itemCreateInfo.set_leafName(thisGUID); //创建叶子文件夹节点 
                var oListItem = oList.addItem(itemCreateInfo);
                oListItem.update(); //提交更新
                clientContext.load(oListItem);
                clientContext.load(oList);
                clientContext.executeQueryAsync(function (data) {
                    var guid = oList.get_id().toString();
                    dtd.resolve(thisGUID, guid);
                }, function () {
                    dtd.reject();
                });
                return dtd.promise();
            },
            CreateDocLib: function (DocLibName) {
                var dtd = $.Deferred();
                var clientContext;
                var oWebsite;
                var oList;
                var itemCreateInfo;
                clientContext = new SP.ClientContext.get_current(); //获取上下文对象
                oWebsite = clientContext.get_web(); //获取当前网站对象

                var listCreationInfo = new SP.ListCreationInformation();
                listCreationInfo.set_title(DocLibName);
                listCreationInfo.set_templateType(101);
                var oList = oWebsite.get_lists().add(listCreationInfo);
                clientContext.load(oList);
                clientContext.executeQueryAsync(function (data) {
                    var guid = oList.get_id().toString();
                    var staticName = oList.get_entityTypeName();
                    dtd.resolve(guid, staticName);
                }, function () {
                    dtd.reject();
                });
                return dtd.promise();
            },
            UpdateDocLib: function (DocLibName, NewDocLibName) {
                var dtd = $.Deferred();
                var clientContext;
                var oWebsite;
                var oList;
                var itemCreateInfo;
                clientContext = new SP.ClientContext.get_current(); //获取上下文对象
                oWebsite = clientContext.get_web(); //获取当前网站对象
                var oList = oWebsite.get_lists().getByTitle(DocLibName);
                oList.set_title(NewDocLibName);
                oList.update();
                clientContext.load(oList);
                clientContext.executeQueryAsync(function (data) {
                    var guid = oList.get_id().toString();
                    dtd.resolve(guid);
                }, function (d) {
                    dtd.reject();
                });
                return dtd.promise();
            },
            DeleteDocLib: function (DocLibName) {
                var dtd = $.Deferred();
                var clientContext;
                var oWebsite;
                var oList;
                var itemCreateInfo;
                clientContext = new SP.ClientContext.get_current(); //获取上下文对象
                oWebsite = clientContext.get_web(); //获取当前网站对象
                var oList = oWebsite.get_lists().getByTitle(DocLibName);
                oList.deleteObject();
                clientContext.executeQueryAsync(function (data) {
                    dtd.resolve(data);
                }, function (d) {
                    dtd.reject();
                });
                return dtd.promise();
            },
            CreatedDocFolder: function (folderName, docLibName) {
                var dtd = $.Deferred();
                var clientContext;
                var oWebsite;
                var oList;
                var itemCreateInfo;
                clientContext = new SP.ClientContext.get_current(); //获取上下文对象
                oWebsite = clientContext.get_web(); //获取当前网站对象
                oList = oWebsite.get_lists().getByTitle(docLibName || "Documents"); //获取文档库列表

                itemCreateInfo = new SP.ListItemCreationInformation();
                itemCreateInfo.set_underlyingObjectType(SP.FileSystemObjectType.folder);

                itemCreateInfo.set_leafName(folderName); //创建叶子文件夹节点 
                var oListItem = oList.addItem(itemCreateInfo);
                oListItem.update(); //提交更新
                clientContext.load(oListItem);
                clientContext.load(oList);
                clientContext.executeQueryAsync(function (data) {
                    var guid = oList.get_id().toString();
                    dtd.resolve(guid);
                }, function () {
                    dtd.reject(arguments);
                });
                return dtd.promise();
            },
            DeleteDocFolder: function (DocFolderUrl) {
                var dtd = $.Deferred();
                var clientContext;
                var oWebsite;
                var folderUrl;

                clientContext = new SP.ClientContext.get_current(); //获取上下文对象
                oWebsite = clientContext.get_web(); //获取当前网站对象
                clientContext.load(oWebsite);
                clientContext.executeQueryAsync(function (data) {
                    folderUrl = oWebsite.get_serverRelativeUrl() + DocFolderUrl
                    var folderToDelete = oWebsite.getFolderByServerRelativeUrl(folderUrl);
                    folderToDelete.deleteObject();
                    clientContext.executeQueryAsync(function (d) {
                        dtd.resolve(d);
                    }, function () {
                        dtd.reject();
                    });
                }, function () {
                    dtd.reject();
                });
                return dtd.promise();
            },
            DeleteDocument: function (DocUrl) {
                var dtd = $.Deferred();
                var clientContext;
                var oWebsite;
                var folderUrl;
                clientContext = new SP.ClientContext.get_current(); //获取上下文对象
                oWebsite = clientContext.get_web(); //获取当前网站对象
                clientContext.load(oWebsite);
                clientContext.executeQueryAsync(function () {
                    var fileToDelete = oWebsite.getFileByServerRelativeUrl(DocUrl);
                    fileToDelete.deleteObject();
                    clientContext.executeQueryAsync(function (d) {
                        dtd.resolve(d);
                    }, function () {
                        dtd.reject();
                    });
                }, function () {
                    dtd.reject();
                });
                return dtd.promise();
            },
            UploadFile: function (guid, listGuid, folderName) {
                var dtd = $.Deferred();
                var tempUrl = _spPageContextInfo.webAbsoluteUrl + "/_layouts/Upload.aspx?List={" + listGuid + "}&RootFolder=" + (folderName || "Shared%20Documents") + "%2F" + guid; //&RootFolder=Documents%2F&IsDlg=1
                var options = {
                    url: tempUrl,
                    showClose: true,
                    allowMaximize: false,
                    width: 450,
                    dialogReturnValueCallback: function (dialogResult, returnValue) {
                        if (dialogResult == SP.UI.DialogResult.OK) {
                            dtd.resolve(returnValue.newFileUrl, returnValue.newFileUrl.substring(returnValue.newFileUrl.lastIndexOf("/") + 1, returnValue.newFileUrl.length));
                        }
                        SP.UI.ModalDialog.commonModalDialogClose(dialogResult);
                    }
                };
                SP.UI.ModalDialog.showModalDialog(options);
                return dtd.promise();
            },
            apiGet: APIGet,
            //<!--Create by BenLampson 2014-07-18 13:19:421-->
            //<!--Modify by BenLampson 2014-07-21 15:28:34 Add APIHttpContent-->
            //<!--Modify By Ben Lampson 2014-07-26 Add apiPostFile-->
            apiWCFGet: APIWCFGetJson, //Use to send WCF API REQUEST
            apiGetHttpContent: APIGetHttpContent, //Use to send WCF API REQUEST
            apiPostFile: APIPostFile, //Use to upload rest file
            //<!--Create by BenLampson 2014-07-18 13:19:44-->
            apiPost: function (method, data, etag, siteUrl, headers) {
                return APIPost(method, data, 'POST', etag, siteUrl, headers)
            },
            apiMerge: function (method, data, etag, siteUrl, headers) {
                return APIPost(method, data, 'MERGE', etag, siteUrl, headers)
            },
            apiDelete: function (method, data, etag, siteUrl, headers) {
                return APIPost(method, data, 'DELETE', etag, siteUrl, headers)
            },
            getUserName: function (userID) {
                return APIGet("/Web/GetUserById(" + userID + ")", null, _spPageContextInfo.siteAbsoluteUrl);
            },
            webService: function (service, message, sync, siteUrl) {
                var dtd = $.Deferred();
                var site = siteUrl || getCurrentSite();
                var result = '';

                var message = SOAPEnvelope.header +
                    message +
                    SOAPEnvelope.footer;

                $.ajax({
                    async: !sync,
                    url: site + "/_vti_bin/" + service + ".asmx",
                    type: "POST",
                    data: message,
                    //dataType: ($.browser.msie) ? "text" : "xml",  
                    dataType: "xml",
                    contentType: "text/xml;charset=\"utf-8\"",
                    complete: function (xData, Status) {
                        if (Status == 'success') {
                            if ($.browser.msie) {
                                result = $().GetXmlObject(xData.responseText);
                            } else {
                                result = xData.responseText;
                            }
                            dtd.resolve(result);
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        dtd.reject(jqXHR, textStatus, errorThrown);
                    }
                });

                return dtd.promise();
            },

            delayExecute: function (func, js) {
                // SP.SOD.executeFunc(js||'sp.init.js', null, func);
                ExecuteOrDelayUntilScriptLoaded(func, js || "sp.js");
            },

            initItemFields: initItemFields,
            initItem: initItem,
            setItemFields: setItemFields,
            addListItem: function (list) {
                return list.addItem(new SP.ListItemCreationInformation());
            },
            queryById: queryById,
            callWebService: callWebService,
            GetAllUserCollection: GetAllUserCollection,
            searchUser: searchUser,
            searchUserWCF: searchUserWCF,
            searchAllUser: searchAllUser,
            resolvePrincipals: resolvePrincipals,
            getUserProfileByAccount: getUserProfileByAccount,
            querySingleItem: querySingleItem,
            queryItems: queryItems,
            queryItemsArray: queryItemsArray,
            queryItemsPaging: queryItemsPaging,
            queryItemsPagingArray: queryItemsPagingArray,
            hasItems: hasItems,
            getField: getField,
            getFieldChoices: getFieldChoices
        });

    })("Akmii.SP");

    (function (namespace) {
        var Caml_LookUpId = "LookupId='TRUE'";
        var Caml_IncludeTime = "IncludeTimeValue='TRUE'";


        var Type_MultiChoice = "MultiChoice";
        var Type_Choice = "Choice";
        var Type_Text = "Text";
        var Type_Number = "Number";
        var Type_Integer = "Integer";
        var Type_Lookup = "Lookup";
        var Type_Date = "Date";
        var Type_DateTime = "DateTime";
        var Type_User = "Lookup";
        var CurrentUser = "<UserID Type=\"Integer\"/>";

        function ConcatConditions(method) {
            var condition = "";
            var args = arguments[1];

            if (args.length > 0) {
                condition = args[0];
                for (var i = 1; i < args.length; i++) {
                    if (Akmii.Utility.isNullorEmpty(condition)) {
                        condition = args[i];
                    } else if (Akmii.Utility.isNullorEmpty(args[i])) {

                    } else {
                        condition = "<" + method + ">" + condition + args[i] + "</" + method + ">";
                    }
                }
            }
            return condition;
        }

        function And() {
            return ConcatConditions("And", arguments);
        }

        function Or() {
            return ConcatConditions("Or", arguments);
        }

        function EqID(id) {
            return Eq("ID", Type_Number, id);
        }

        function CurrentUserOrGroup(field) {
            return Or(Membership(field), Eq(field, Type_Integer, CurrentUser));
        }

        function Membership(field) {
            return "<Membership Type=\"CurrentUserGroups\"><FieldRef Name=\"" + field + "\"/></Membership>";
        }

        function User(id) {
            return "<UserID Type=\"Integer\">" + id + "</UserID>";
        }

        function GroupBy(fieldName) {
            return "<GroupBy><FieldRef Name=\"" + fieldName + "\"/></GroupBy>";
        }

        function OrderByField(fieldName, decending) {
            var asc = (decending) ? "False" : "True";
            return "<FieldRef Name=\"" + fieldName + "\" Ascending=\"" + asc + "\" />";
        }

        function OrderBys() {
            var orderby = "";
            if (arguments.length > 0) {
                for (var i = 0; i < arguments.length; i++) {
                    orderby += arguments[0];
                }
            }

            return "<OrderBy>" + orderby + "</OrderBy>";
        }

        function Condition(op, fieldName, valueType, value) {
            var placeHolderLookup = "";
            var placeHolderIncludeTime = "";

            if (valueType == Type_Lookup || valueType == Type_User) {
                placeHolderLookup = " " + Caml_LookUpId;
            } else if (valueType == Type_DateTime) {
                placeHolderIncludeTime = " " + Caml_IncludeTime;
            }

            if (typeof (value) == Date) {
                value = value.ToString("yyyy-MM-ddTHH:mm:ssZ");
            }

            return "<" + op + "><FieldRef Name='" + fieldName + "'" + placeHolderLookup + "/><Value Type='" + valueType + "'" + placeHolderIncludeTime + ">" + value + "</Value></" + op + ">";
        }

        function Eq(fieldName, valueType, value) {
            return Condition("Eq", fieldName, valueType, value);
        }

        function Gt(fieldName, valueType, value) {
            return Condition("Gt", fieldName, valueType, value);
        }

        function Lt(fieldName, valueType, value) {
            return Condition("Lt", fieldName, valueType, value);
        }

        function Geq(fieldName, valueType, value) {
            return Condition("Geq", fieldName, valueType, value);
        }

        function Leq(fieldName, valueType, value) {
            return Condition("Leq", fieldName, valueType, value);
        }

        function Neq(fieldName, valueType, value) {
            return Condition("Neq", fieldName, valueType, value);
        }

        function Contains(fieldName, valueType, value) {
            return Condition("Contains", fieldName, valueType, value);
        }

        function IsNull(fieldName) {
            return "<IsNull><FieldRef Name='" + fieldName + "'/></IsNull>";
        }

        function IsNotNull(fieldName) {
            return "<IsNotNull><FieldRef Name='" + fieldName + "'/></IsNotNull>";
        }

        function BeginsWith(fieldName, valueType, value) {
            return Condition("BeginsWith", fieldName, valueType, value);
        }

        function In(fieldName, valueType, values) {
            var placeholder = "";

            if (valueType == Type_Lookup || valueType == Type_User) {
                placeholder += Caml_LookUpId;
            }

            var caml = "";
            caml += "<In>";
            caml += "<FieldRef Name='" + fieldName + "' " + placeholder + "/>";
            caml += "<Values>";
            if (values && values.length > 0) {
                for (var i = 0; i < values.length; i++) {
                    var str;
                    var value = values[i];
                    if (typeof (value) == Date) {
                        str = value.ToString("yyyy-MM-ddTHH:mm:ssZ");
                    } else {
                        str = value + "";
                    }
                }
                caml += "<Value Type='" + valueType + "'>" + str + "</Value>";
            } else {
                caml += "<Value Type='" + valueType + "'></Value>";
            }
            caml += "</Values>";
            caml += "</In>";
            return caml;
        }

        function OnlyFolder() {
            return Eq("FSObjType", Type_Number, "1");
        }

        function WithoutFolder() {
            return Eq("FSObjType", Type_Number, "0");
        }

        function Field(field) {
            return "<FieldRef Name='" + field + "'/>";
        }

        function ViewFields(fields, excludeDefault) {
            var viewFields = "";
            $.each(fields, function (i, d) {
                viewFields += Field(d);
            });

            //add default fields
            if (!excludeDefault)
                viewFields += Field("Title") + Field("Author") + Field("Created") + Field("Editor") + Field("Modified");

            return "<ViewFields>" + viewFields + "</ViewFields>";
        }

        function MinimalViewFields() {
            return ViewFields(["ID"], true);
        }


        /**
         * GEQ(begin) and LEQ(end)
         * @param field
         * @param begin
         * @param end
         * @param includingTime
         */
        function InDateRange(field, begin, end, includingTime) {
            var type = includingTime ? Type_DateTime : Type_Date;
            var query = "";
            if (begin) {
                query = Geq(field, type, begin);
            }

            if (end) {
                query = And(query, Leq(field, type, end));
            }

            return query;
        }

        function BuildView(fieldsArr, query, orderbyfields, rowLimit, excludeDefault) {
            var q = query || "";
            var limit = "";
            if (rowLimit) {
                limit = "<RowLimit>" + rowLimit + "</RowLimit>";
            }
            var fields = "";
            if (fieldsArr) {
                fields = ViewFields(fieldsArr, excludeDefault);
            }

            var orderby = "";
            if (orderbyfields) {
                orderby = OrderBys(orderbyfields);
            }
            var where = "";
            if (q) {
                where = "<Where>" + q + "</Where>";
            }

            return "<View>" + fields + "<Query>" + where + orderby + "</Query>" + limit + "</View>";
        }

        Akmii.defineNS(namespace, {
            Type_MultiChoice: Type_MultiChoice,
            Type_Choice: Type_Choice,
            Type_Text: Type_Text,
            Type_Number: Type_Number,
            Type_Integer: Type_Integer,
            Type_Lookup: Type_Lookup,
            Type_Date: Type_Date,
            Type_DateTime: Type_DateTime,
            Type_User: Type_User,
            CurrentUser: CurrentUser,
            And: And,
            Or: Or,
            EqID: EqID,
            CurrentUserOrGroup: CurrentUserOrGroup,
            Membership: Membership,
            User: User,
            GroupBy: GroupBy,
            OrderByField: OrderByField,
            OrderBys: OrderBys,
            Eq: Eq,
            Lt: Lt,
            Gt: Gt,
            Geq: Geq,
            Leq: Leq,
            Neq: Neq,
            Contains: Contains,
            In: In,
            OnlyFolder: OnlyFolder,
            WithoutFolder: WithoutFolder,
            IsNull: IsNull,
            IsNotNull: IsNotNull,
            BeginsWith: BeginsWith,
            InDateRange: InDateRange,
            MinimalViewFields: MinimalViewFields,
            ViewFields: ViewFields,
            BuildView: BuildView
        });

    })("Akmii.SP.Caml");


    (function (namespace) {
        var msg_systemError = "System error, please contact IT helpdesk.";
        var dlgdiv = $("<div title='Error' style='line-height:20px;'><p><span class='ui-icon ui-icon-alert' style='float: left; margin:.2em .3em 0 1em'></span><strong>Alert: </strong> <span class='errormsg'></span></p></div>");
        var confirmDlg = $("<div><p><span class='ui-icon ui-icon-alert' style='float:left; margin:0 7px 20px 0;'></span><span class='msg'></span></p></div>");
        var confirmdiv = "<div class='modal ak-zsm-modal' id='akmiiconfirm' tabindex='-1' role='dialog' aria-hidden='true' style='z-index:9999' data-backdrop='static'>";
        confirmdiv += "<div class='modal-dialog modal-sm'><div class='modal-content'><div class='modal-header clearfix'>";
        confirmdiv += " <button type='button' class='close' data-dismiss='modal'> <span class='sr-only'>Close</span> </button>";
        confirmdiv += "<h4 class='modal-title pull-left'>[Title]</h4>";
        confirmdiv += "<div class='ak-footer-btn text-right pull-right visible-xs'>";
        confirmdiv += " <button class='ak-zdl-createbtn ok' type='button'> [BtnOk]</button>";
        confirmdiv += "</div>";
        confirmdiv += "</div>";
        confirmdiv += "<div class='modal-body ak-main-body'>";
        confirmdiv += "<p>[Message]</p>";
        confirmdiv += "<div class='ak-footer-btn text-right m-t-15 hidden-xs'>";
        confirmdiv += " <button class='ak-zdl-createbtn ok' type='button'   > [BtnOk] </button>";
        confirmdiv += "<button class='ak-zdl-createbtn cancel'  type='button' > [BtnCancel]</button>";
        confirmdiv += "</div></div></div></div>";


        Akmii.defineNS(namespace, {
            executeQueryError: function (sender, args) {
                if (args != null) toastr.error(args.get_message(), "System Error!");
                else toastr.error(msg_systemError);
            },
            ajaxError: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR && jqXHR.responseText) {
                    var err = $.parseJSON(jqXHR.responseText);
                    toastr.error(err.Message);
                } else if (errorThrown) {
                    toastr.error(errorThrown);
                } else {
                    toastr.error(msg_systemError);
                }
            },
            spRESTError: function (error) {
                if (typeof error === 'string') {
                    toastr.error(error);
                } else if (error && error.responseText) {
                    if (typeof error.responseText === 'string') {
                        var err = $.parseJSON(error.responseText);
                        toastr.error(err.error.message.value);
                    }
                } else {
                    toastr.error(msg_systemError);
                }
            },
            error: function (msg, title) {
                toastr.error(msg, title);
            },
            info: function (msg, title) {
                toastr.info(msg, title);
            },
            success: function (msg, title) {
                toastr.success(msg, title);
            },
            warning: function (msg, title) {
                toastr.warning(msg, title);
            },
            confirm: function (options) {
                try {
                    $("#akmiiconfirm").remove();
                } catch (e) { }
                $("body").append(confirmdiv);
                var reg = new RegExp("\\[([^\\[\\]]*?)\\]", 'igm');
                var alr = $("#akmiiconfirm");
                var ahtml = alr.html();
                alr.html(ahtml);
                alr.find('.ok').removeClass('btn-primary').addClass('btn-success');
                alr.find('.cancel').show();
                var ops = {
                    msg: "确认要执行该操作？",
                    title: "确认",
                    btnok: "确定",
                    btncl: "取消"
                };
                $.extend(ops, options);
                var html = alr.html().replace(reg, function (node, key) {
                    return {
                        Title: ops.title,
                        Message: ops.msg,
                        BtnOk: ops.btnok,
                        BtnCancel: ops.btncl
                    }[key];
                });
                alr.html(html);
                alr.modal({
                    width: 500,
                    backdrop: 'static'
                });
                return {
                    on: function (callback) {
                        if (callback && callback instanceof Function) {
                            alr.find('.ok').click(function () {
                                alr.modal('hide');
                                callback(true)
                            });
                            alr.find('.cancel').click(function () {
                                alr.modal('hide');
                                callback(false)
                            });
                        }
                    }
                };

            },
            alert: function (options) {
                try {
                    $("#akmiiconfirm").remove();
                } catch (e) { }
                $("body").append(confirmdiv);
                var reg = new RegExp("\\[([^\\[\\]]*?)\\]", 'igm');
                var alr = $("#akmiiconfirm");
                var ahtml = alr.html();
                alr.html(ahtml);
                alr.find('.ok').hide();
                alr.find('.cancel').hide();
                var ops = {
                    msg: "确认要执行该操作？",
                    title: "提示",
                    btnok: "确定",
                    btncl: "取消"
                };
                $.extend(ops, options);
                var html = alr.html().replace(reg, function (node, key) {
                    return {
                        Title: ops.title,
                        Message: ops.msg,
                        BtnOk: ops.btnok,
                        BtnCancel: ops.btncl
                    }[key];
                });
                alr.html(html);
                alr.modal({
                    width: 500,
                    backdrop: 'static'
                });
                return {
                    on: function (callback) {
                        if (callback && callback instanceof Function) {
                            alr.find('.ok').click(function () {
                                callback(true)
                            });
                        }
                    }
                };
                var _dialog = function (options) {
                    var ops = {
                        msg: "确认要执行该操作？",
                        title: "Confirm",
                        btnok: "确定",
                        btncl: "取消"
                    };
                    $.extend(ops, options);
                    var html = alr.html().replace(reg, function (node, key) {
                        return {
                            Title: ops.title,
                            Message: ops.msg,
                            BtnOk: ops.btnok,
                            BtnCancel: ops.btncl
                        }[key];
                    });
                    alr.html(html);
                    alr.modal({
                        width: 500,
                        backdrop: 'static'
                    });
                }
            },
            screenError: function (msg, title) {
                dlgdiv.attr('title', title ? title : "Error");
                dlgdiv.find('.errormsg').text(msg);

                dlgdiv.dialog({
                    modal: true,
                    buttons: [{
                        text: "OK",
                        click: function () {
                            $(this).dialog("close");
                        }
                    }]
                });
            }

        });

    })("Akmii.UI");

    (function (namespace) {
        Akmii.defineNS(namespace, {
            Add: function (key, obj, folder) {
                var tempModel = {};
                tempModel[key] = obj;
                if (folder) {
                    Akmii.defineNS(namespace + '.' + folder, tempModel);
                } else {
                    Akmii.defineNS(namespace, tempModel);
                }
            },
            WaitingToLoad: function (waitingKey, Method, cycTime) {
                setTimeout(function () {
                    if (Akmii.Cache[waitingKey] == undefined) {
                        Akmii.Cache.WaitingToLoad(waitingKey, Method, cycTime);
                    } else {
                        Method();
                    }
                }, cycTime || 500);
            }
        });

    })("Akmii.Cache");

    (function (namespace) {
        Akmii.defineNS(namespace, {
            JqueryUIDatePickerBind: function () {
                ko.bindingHandlers.datepicker = {
                    init: function (element, valueAccessor, allBindingsAccessor) {
                        //initialize datepicker with some optional options
                        var options = allBindingsAccessor().datepickerOptions || {},
                            $el = $(element);

                        $el.datepicker(options);

                        //handle the field changing
                        ko.utils.registerEventHandler(element, "change", function () {
                            var observable = valueAccessor();
                            if ($el.datepicker("getDate"))
                                observable($el.datepicker("getDate").formatDate("mm/dd/yyyy"));
                            else
                                observable($el.datepicker("getDate"));
                        });

                        //handle disposal (if KO removes by the template binding)
                        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                            $el.datepicker("destroy");
                        });

                    },
                    update: function (element, valueAccessor) {
                        var value = ko.utils.unwrapObservable(valueAccessor()),
                            $el = $(element);

                        //handle date data coming via json from Microsoft
                        if (String(value).indexOf('/Date(') == 0) {
                            value = new Date(parseInt(value.replace(/\/Date\((.*?)\)\//gi, "$1")));
                        }

                        var current = $el.datepicker("getDate");

                        if (value - current !== 0) {
                            $el.datepicker("setDate", value);
                        }
                    }
                };
            },
            My97Bind: function () { /*  my97datepicker  时间格式'yyyy/MM/dd' 自定义的knockout绑定，用于wdate的绑定              */
                ko.bindingHandlers.datetimes = {
                    init: function (element, valueAccessor, viewModel) {
                        var value = ko.utils.unwrapObservable(valueAccessor());
                        $(element).attr("class", "Wdate");

                        if (value == undefined) {
                            value = new Date();
                        };
                        if (typeof (value) == "string") {
                            $(element).val(new Date(value).formatDate("yyyy/mm/dd"));
                        } else {
                            $(element).val(value.formatDate("yyyy/mm/dd"));
                        }
                    },
                    update: function (element, valueAccessor, viewModel) {
                        var value = ko.utils.unwrapObservable(valueAccessor());

                        if (value == undefined) {
                            value = new Date();
                            valueAccessor()(value.formatDate("yyyy/mm/dd"));
                        };
                        if (typeof (value) != "string") {
                            $(element).val(value.formatDate("yyyy/mm/dd"));
                        } else {
                            $(element).val(value);
                        }
                        $(element).blur(function () {
                            var v = $(element).val();
                            valueAccessor()(v);
                        });
                    }
                };
            },
            My97BindMin: function () { /*  my97datepicker  时间格式'yyyy/MM/dd' 自定义的knockout绑定，用于wdate的绑定              */
                ko.bindingHandlers.datetimes = {
                    init: function (element, valueAccessor, viewModel) {
                        var value = ko.utils.unwrapObservable(valueAccessor());
                        $(element).attr("class", "Wdate");

                        if (value == undefined) {
                            value = new Date();
                        };
                        if (typeof (value) == "string") {
                            $(element).val(new Date(value).formatDate("yyyy/mm/dd HH:mm"));
                        } else {
                            $(element).val(value.formatDate("yyyy/mm/dd HH:mm"));
                        }

                    },
                    update: function (element, valueAccessor, viewModel) {
                        var value = ko.utils.unwrapObservable(valueAccessor());

                        if (value == undefined) {
                            value = new Date();
                            valueAccessor()(value.formatDate("yyyy/mm/dd HH:mm"));
                        };
                        if (typeof (value) != "string") {
                            $(element).val(value.formatDate("yyyy/mm/dd HH:mm"));
                        } else {
                            $(element).val(value);
                        }
                        $(element).blur(function () {
                            var v = $(element).val();
                            valueAccessor()(v);
                        });
                    }
                };
            }
        });

    })("Akmii.KOBD");

})(this, jQuery);


/*!
 * jQuery outside events - v1.1 - 3/16/2010
 * http://benalman.com/projects/jquery-outside-events-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

(function ($, doc, outside) {
    '$:nomunge'; // Used by YUI compressor.

    $.map(
        // All these events will get an "outside" event counterpart by default.
        'click dblclick mousemove mousedown mouseup mouseover mouseout change select submit keydown keypress keyup'.split(' '),
        function (event_name) {
            jq_addOutsideEvent(event_name);
        }
    );

    // The focus and blur events are really focusin and focusout when it comes
    // to delegation, so they are a special case.
    jq_addOutsideEvent('focusin', 'focus' + outside);
    jq_addOutsideEvent('focusout', 'blur' + outside);

    // Method: jQuery.addOutsideEvent
    // 
    // Register a new "outside" event to be with this method. Adding an outside
    // event that already exists will probably blow things up, so check the
    // <Default "outside" events> list before trying to add a new one.
    // 
    // Usage:
    // 
    // > jQuery.addOutsideEvent( event_name [, outside_event_name ] );
    // 
    // Arguments:
    // 
    //  event_name - (String) The name of the originating event that the new
    //    "outside" event will be powered by. This event can be a native or
    //    custom event, as long as it bubbles up the DOM tree.
    //  outside_event_name - (String) An optional name for the new "outside"
    //    event. If omitted, the outside event will be named whatever the
    //    value of `event_name` is plus the "outside" suffix.
    // 
    // Returns:
    // 
    //  Nothing.

    $.addOutsideEvent = jq_addOutsideEvent;

    function jq_addOutsideEvent(event_name, outside_event_name) {

        // The "outside" event name.
        outside_event_name = outside_event_name || event_name + outside;

        // A jQuery object containing all elements to which the "outside" event is
        // bound.
        var elems = $(),

            // The "originating" event, namespaced for easy unbinding.
            event_namespaced = event_name + '.' + outside_event_name + '-special-event';

        // Event: outside events
        // 
        // An "outside" event is triggered on an element when its corresponding
        // "originating" event is triggered on an element outside the element in
        // question. See the <Default "outside" events> list for more information.
        // 
        // Usage:
        // 
        // > jQuery('selector').bind( 'clickoutside', function(event) {
        // >   var clicked_elem = $(event.target);
        // >   ...
        // > });
        // 
        // > jQuery('selector').bind( 'dblclickoutside', function(event) {
        // >   var double_clicked_elem = $(event.target);
        // >   ...
        // > });
        // 
        // > jQuery('selector').bind( 'mouseoveroutside', function(event) {
        // >   var moused_over_elem = $(event.target);
        // >   ...
        // > });
        // 
        // > jQuery('selector').bind( 'focusoutside', function(event) {
        // >   var focused_elem = $(event.target);
        // >   ...
        // > });
        // 
        // You get the idea, right?

        $.event.special[outside_event_name] = {

            // Called only when the first "outside" event callback is bound per
            // element.
            setup: function () {

                // Add this element to the list of elements to which this "outside"
                // event is bound.
                elems = elems.add(this);

                // If this is the first element getting the event bound, bind a handler
                // to document to catch all corresponding "originating" events.
                if (elems.length === 1) {
                    $(doc).bind(event_namespaced, handle_event);
                }
            },

            // Called only when the last "outside" event callback is unbound per
            // element.
            teardown: function () {

                // Remove this element from the list of elements to which this
                // "outside" event is bound.
                elems = elems.not(this);

                // If this is the last element removed, remove the "originating" event
                // handler on document that powers this "outside" event.
                if (elems.length === 0) {
                    $(doc).unbind(event_namespaced);
                }
            },

            // Called every time a "outside" event callback is bound to an element.
            add: function (handleObj) {
                var old_handler = handleObj.handler;

                // This function is executed every time the event is triggered. This is
                // used to override the default event.target reference with one that is
                // more useful.
                handleObj.handler = function (event, elem) {

                    // Set the event object's .target property to the element that the
                    // user interacted with, not the element that the "outside" event was
                    // was triggered on.
                    event.target = elem;

                    // Execute the actual bound handler.
                    old_handler.apply(this, arguments);
                };
            }
        };

        // When the "originating" event is triggered..
        function handle_event(event) {

            // Iterate over all elements to which this "outside" event is bound.
            $(elems).each(function () {
                var elem = $(this);

                // If this element isn't the element on which the event was triggered,
                // and this element doesn't contain said element, then said element is
                // considered to be outside, and the "outside" event will be triggered!
                if (this !== event.target && !elem.has(event.target).length) {

                    // Use triggerHandler instead of trigger so that the "outside" event
                    // doesn't bubble. Pass in the "originating" event's .target so that
                    // the "outside" event.target can be overridden with something more
                    // meaningful.
                    elem.triggerHandler(outside_event_name, [event.target]);
                }
            });
        };

    };

})(jQuery, document, "outside");

(function ($) {

    //ko.observable(new Date('1/4/2000')).extend({ dateformat: '' });
    ko.extenders.dateformat = function (target, format) {
        var result = ko.computed({
            read: target,
            write: function (newValue) {
                target(newValue ? newValue.formatDate(format) : "");
            }
        }).extend({
            notify: 'always'
        });

        //initializing with the formatted value
        result(target());

        //return the new computed observable
        return result;
    };

    ko.observableArray.fn.refresh = function () {
        var data = this().slice(0);
        this([]);
        this(data);
    };
})(jQuery);

(function ($) {
    $.extend({
        /**              
         * 时间戳转换日期              
         * @param <int> unixTime    待时间戳(秒)              
         * @param <bool> isFull    返回完整时间(Y-m-d 或者 Y-m-d H:i:s) 
         */
        FormatViewDate: function (unixTime, isFull) {
            if (!unixTime || $.trim(unixTime) === "") {
                return "";
            }

            try {
                var time = new Date(unixTime);
                var ymdhis = "";

                ymdhis += time.getFullYear() + "/";
                ymdhis += (time.getMonth() + 1) + "/";
                ymdhis += time.getDate();

                if (isFull === true) {
                    ymdhis += " " + time.getHours() + ":";
                    ymdhis += time.getMinutes() + ":";
                    ymdhis += time.getSeconds();
                }

                return ymdhis;
            } catch (e) {
                return "";
            }
        }
    });
})(jQuery);

(function ($) {
    $.extend({
        MenuStyle: function () {
            var url = window.location.href;
            var urlArray = url.split("/");
            var pageNmae = urlArray[urlArray.length - 1];

            switch (pageNmae) {
                case "my-tasks.aspx":
                    $("#idTask").css("color", "#337ab7");
                    return;
                case "applicantion.aspx":
                    $("#idApplicantion").css("color", "#337ab7");
                    return;
                case "ReportList.aspx":
                    $("#idReport").css("color", "#337ab7");
                    return;
                case "Setting.aspx":
                    $("#idSetting").css("color", "#337ab7");
                    return;
            }
        }
    });
})(jQuery);

///处理FlowLogs数据
///参数： canID 容器id，data需要处理的数据集JSON, sort 排序规则（默认为倒序）
(function ($) {
    $.extend({
        ProcessFlowLogs: function (parameterArray) {
            var boxID = parameterArray.boxID;
            var data = parameterArray.data;
            var isCall = parameterArray.isCall;
            var sort = parameterArray.sort;
            var fromPhone = parameterArray.fromPhone;
            var workFlowType = parameterArray.workFlowType;

            var shell = "<div class=\"row ak-approve-status\">Flow Logs&nbsp;&nbsp;<span class=\"ak-tchinese\">流程日志</span></div>" +
                "<div class=\"table-responsive\">";
            var tableHead = "<table border=\"0\" class=\"table ak-table-list \">" +
                "<thead>" +
                "<tr>" +
                "<th class=\"ak-table-td1\"></th>" +
                //"<th></th>" +
                "<th class=\"user_num\">Type<br>" +
                "<span class=\"ak-tchinese\">审批类型</span></th>" +
                "<th class=\"user_name\">Time<br>" +
                "<span class=\"ak-tchinese\">时间</span></th>" +
                "<th class=\"user_dept\">Approver<br>" +
                "<span class=\"ak-tchinese\">用户</span></th>" +
                "<th class=\"user_tel\">Action<br>" +
                "<span class=\"ak-tchinese\">操作</span></th>" +
                "<th class=\"job_title\">Comment<br>" +
                "<span class=\"ak-tchinese\">备注</span></th>" +
                "</tr>" +
                "</thead>" +
                "<tbody>";
            var tableTail = "</tbody>" +
                "</table>" +
                "</div>";
            var content = "";

            if (sort == "asc") {
                if (data) {
                    for (var i = 0; i < data().length; i++) {
                        content += "<tr>" +
                            "<td class=\"ak-table-td1\"></td>" +
                            //"<td><span class=\"ak-req\" style=\"cursor:hand\" onclick=\"javascript:jQuery.CallREQ('" + fromPhone + "','" + data()[i].ToPhone + "')\">Emergency REQ</span></td>" +
                            "<td>" + data()[i].Type + "</td>" +
                            "<td>" + data()[i].Time + "</td>" +
                            //(isCall ? "<td><span class=\"fa phone\" style=\"cursor:hand\" onclick=\"javascript:jQuery.CallExamine('" + fromPhone + "','" + data()[a].ToPhone + "')\"></span>" + data()[a].User + "</td>" : "<td>" + data()[a].User + "</td>") +
                            "<td>" + data()[a].User + "</td>" +
                            "<td>" + data()[i].Action + "</td>" +
                            "<td>" + data()[i].Comment + "</td>" +
                            "</tr>";
                    }
                }
            } else {
                if (data && data().length > 0) {
                    for (var j = data().length; j > 0; j--) {
                        var a = j - 1;

                        content += "<tr>" +
                            "<td class=\"ak-table-td1\"></td>" +
                            //"<td><span class=\"ak-req\" style=\"cursor:hand\" onclick=\"javascript:jQuery.CallREQ('" + data()[a].ToPhone + "','" + data()[a].TaskID + "','" + workFlowType + "')\">Emergency REQ</span></td>" +
                            "<td>" + data()[a].Type + "</td>" +
                            "<td>" + data()[a].Time + "</td>" +
                            //(isCall ? "<td><span class=\"fa phone\" style=\"cursor:hand\" onclick=\"javascript:jQuery.CallExamine('" + fromPhone + "','" + data()[a].ToPhone + "')\"></span>" + data()[a].User + "</td>" : "<td>" + data()[a].User + "</td>") +
                            "<td>" + data()[a].User + "</td>" +
                            "<td>" + data()[a].Action + "</td>" +
                            "<td>" + data()[a].Comment + "</td>" +
                            "</tr>";
                    }
                }
            }

            $("#" + boxID).html("");
            $("#" + boxID).html(shell + tableHead + content + tableTail);
        }
    });
})(jQuery);

(function ($) {
    $.extend({
        CallExamine: function (fromPhone, toPhone) {
            Ben.JSHelper.GETMethod(SystemAzureUrl + "/WorkFlowCenter/StartCalls(" + fromPhone + ")/toPhone(" + toPhone + ")");
        },
        CallREQ: function (phoneNumber, taskID, workFlowType) {
            Ben.JSHelper.GETMethod(SystemAzureUrl + "WorkFlowCenter/MakeThePhoneCall(" + phoneNumber + ")/TaskID(" + taskID + ")/WorkFlowType(" + workFlowType + ")");
        }
    });
})(jQuery);

if (!Akmii.SP) {
    Akmii.SP = {};
}
if (!Akmii.SP.FlowCentre) {
    Akmii.SP.FlowCentre = {};
}
if (!Akmii.SP.FlowCentre.UC) {
    Akmii.SP.FlowCentre.UC = {};
}

Akmii.SP.FlowCentre.FormTitle = function (data) {
    if (data.length > 0) {
        data = Ben.JSHelper.evalJSON(data);
        var formTitle = "<div class=\"ak-form-banner\">" +
            "<div class=\"container\">" +
            "<div class=\"row ak-banner-row\">" +
            "<div class=\"col-md-4\">" +
            "<h2 class=\"ak-form-h2title\">" + data.formTitle + "</h2>" +
            "</div>" +
            "<div class=\"col-md-2 col-md-offset-6\">" +
            "<button type=\"button\" class=\"btn btn-primary ak-banner-btn\" onclick=\"SP.UI.ModalDialog.showModalDialog({ url: " + data.FlowChartUrl + ", title: " + data.FlowChartTitle + ", width: " + data.FlowChartWidth + ", height: " + data.FlowChartHeight + ", autoSize: " + data.FlowChartAutoSize + ", showClose: " + data.FlowChartShowClose + " });\">Flow Chart</button>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "<div class=\"container ak-content-sm\">" +
            "<div class=\"margin-bottom-20 clearfix ak-border-b2\">" +
            "<h2 class=\"title-v2 col-md-7 no-padding\">" + data.FlowHeadlineEngliese + "<span class=\"f-s-chinese\">" + data.FlowHeadlineChinese + "</span>" +
            "</h2>" +
            "<h2 class=\"ak-application-idstatus col-md-5 no-padding\">" + data.TrackingID +
            "<b>|</b>" + data.CurrentStatus +
            "</h2>" +
            "</div>" +
            "</div>";
        var submitUserInfo = "<div class=\"form-group clearfix\">" +
            "<label class=\"col-lg-2 control-label ak-form-label ak-form-nopadding\" for=\"\">" +
            "<span class=\"ak-english\">Submitted By</span>" +
            "<span class=\"ak-chinese\">提交人</span>" +
            "</label>" +
            "<div class=\"col-lg-4\">" +
            "<input id=\"inputSubmittedBy\" class=\"form-control ak-form-readonly\" type=\"text\" placeholder=\"\" readonly=\"readonly\" value=\"" + data.SubmitUser + "\"\"/>" +
            "</div>" +
            "<label class=\"col-lg-2 control-label ak-form-label ak-form-nopadding\" for=\"\">" +
            "<span class=\"ak-english\">Submitted Date</span>" +
            "<span class=\"ak-chinese\">提交日期</span>" +
            "</label>" +
            "<div class=\"col-lg-4\">" +
            "<input id=\"inputSubmittedDate\" class=\"form-control ak-form-readonly\" type=\"text\" placeholder=\"\" readonly=\"readonly\" value=\"" + data.SubmitDate + "\"\"/>" +
            "</div>" +
            "</div>";

        $("#divFormTitle").append(formTitle);
        $("#divSubmitInfo").append(submitUserInfo);
    }
};
/**
    Js helper.

    Has Operations:
    YunGalaxyJSHelper.ConverJsonTime: function(data) {//把C#的时间格式转换为WEB要展示的时间格式
    YunGalaxyJSHelper.CheckDateTimeFormat: function(mystring) {//检查时间格式是否正确 2014-01-01
    YunGalaxyJSHelper.CreateGUID: function() {//创建一个新的GUID
    YunGalaxyJSHelper.JSONstringify: function(json) {//兼容各种浏览器的JSON转换为字符串
    YunGalaxyJSHelper.evalJSON: function(strJson) {//构造JSON
    YunGalaxyJSHelper.toJSONString: function(object) {//转换至JSON的字符串兼容性不好
    YunGalaxyJSHelper.POSTMethod: function(url, jsonData,isSync) {//向服务器发送POST类型的请求
    YunGalaxyJSHelper.PutMethod: function(url, jsonData,isSync) {//向服务器发送PUT类型的请求
    YunGalaxyJSHelper.GETMethod: function(url, isSync,dataType)  {//向服务器发送Get类型的请求
    YunGalaxyJSHelper.DeleteMethod: function(url, isSync) {//向服务器发送Delete类型的请求
    YunGalaxyJSHelper.GetQueryString: function(name) {//获取当前URL的参数
    YunGalaxyJSHelper.DebugLog: function(message) {//兼容浏览器的写日志
    YunGalaxyJSHelper.GetEnumText:function(enumModel,value) {//根据枚举来获取对应text
    YunGalaxyJSHelper.GetEnumValue: function(enumModel, text) { //根据枚举来获取对应value
    YunGalaxyJSHelper.WeekOfTheYear: function(datetime) { //获取当前时间是今年的第几周如果不传,则默认当前时间
    YunGalaxyJSHelper.LockAllControl: function() { //禁用所有控件
    YunGalaxyJSHelper.UnLockAllControl:function(){//解锁所有控件
    YunGalaxyJSHelper.NewDate: function(dateStringInRange) {//转换日期字符串至日期格式,兼容模式
    YunGalaxyJSHelper.GetDateStr :function(addDayCount, baseDate) {//给某个时间加上一个日期
    YunGalaxyJSHelper.StructModel:function(Dom,NameSpace,FieldsList){//自动构造某一个数据模型,请将NameSpace以使用.分割,FieldsList用,分割
    YunGalaxyJSHelper.SetModelValue: function(Model, FieldsList, Data) { //自动为某一个模型赋值   
    YunGalaxyJSHelper.StructKnockOutModel:function(Dom,NameSpace,FieldsList){//自动构造某一个数据模型,请将NameSpace以使用.分割,FieldsList用,分割-- KnockOut专用
    YunGalaxyJSHelper.SetKnockOutModelValue: function(Model, FieldsList, Data) { //自动为某一个模型赋值--KnockOut专用

*/
var _LoginRequesting = false;
var _LRCallBack;
(function (namePlace) {

    Akmii.defineNS(namePlace, {
        ConverJsonTime: function (data) { //把C#的时间格式转换为WEB要展示的时间格式
            var re = /-?\d+/;
            var m = re.exec(data);
            var d = new Date(parseInt(m[0]));
            return d.formatDate("yyyy-mm-dd");
        },
        CheckDateTimeFormat: function (mystring) { //检查时间格式是否正确 2014-01-01
            var reg = /^(\d{4})-(\d{2})-(\d{2})$/;
            var str = mystring;
            var arr = reg.exec(str);
            if (str == "") return true;
            if (!reg.test(str) && RegExp.$2 <= 12 && RegExp.$3 <= 31) {
                return false;
            }
            return true;
        },
        CreateGUID: function () { //创建一个新的GUID
            var guid = "";
            for (var i = 1; i <= 32; i++) {
                var n = Math.floor(Math.random() * 16.0).toString(16);
                guid += n;
                if ((i == 8) || (i == 12) || (i == 16) || (i == 20))
                    guid += "-";
            }
            return guid;
        },
        JSONstringify: function (json) { //兼容各种浏览器的JSON转换为字符串
            if (window.navigator.appName === "Microsoft Internet Explorer") {
                if (document.documentMode <= 7) {
                    var result = YunGalaxyJSHelper.toJSONString(json);
                } else {
                    var result = JSON.stringify(json);
                }
            } else {

                var result = JSON.stringify(json);
            }
            return result;
        },
        evalJSON: function (strJson) { //构造JSON
            return eval("(" + strJson + ")");
        },
        toJSONString: function (object) { //转换至JSON的字符串
            var type = typeof object;
            if ('object' == type) {
                if (Array == object.constructor)
                    type = 'array';
                else if (RegExp == object.constructor)
                    type = 'regexp';
                else
                    type = 'object';
            }
            switch (type) {
                case 'undefined':
                case 'unknown':
                    return;
                    break;
                case 'function':
                case 'boolean':
                case 'regexp':
                    return object.toString();
                    break;
                case 'number':
                    return isFinite(object) ? object.toString() : 'null';
                    break;
                case 'string':
                    return '"' + object.replace(/(\\|\")/g, "\\$1").replace(/\n|\r|\t/g, function () {
                        var a = arguments[0];
                        return (a == '\n') ? '\\n' : (a == '\r') ? '\\r' : (a == '\t') ? '\\t' : ""
                    }) + '"';
                    break;
                case 'object':
                    if (object === null)
                        return 'null';
                    var results = [];
                    for (var property in object) {
                        var value = YunGalaxyJSHelper.toJSONString(object[property]);
                        if (value !== undefined)
                            results.push(YunGalaxyJSHelper.toJSONString(property) + ':' + value);
                    }
                    return '{' + results.join(',') + '}';
                    break;
                case 'array':
                    var results = [];
                    for (var i = 0; i < object.length; i++) {
                        var value = YunGalaxyJSHelper.toJSONString(object[i]);
                        if (value !== undefined)
                            results.push(value);
                    }
                    return '[' + results.join(',') + ']';
                    break;
            }
        },
        POSTMethod: function (url, jsonData, isSync) { //向服务器发送POST类型的请求
            if ($.cookie("LoginSecret") == null && $.cookie("LoginToken") == null && _KeepLoginState != undefined) { //如果Cookies超时 
                var _PostDtd = $.Deferred();
                if (_LoginRequesting) { //登录后执行   
                    $.when(_LRCallBack).then(function () {
                        YunGalaxyJSHelper.YeeOfficePostMethod(url, jsonData, isSync).then(function (data) {
                            _PostDtd.resolve(data)
                        });
                    });
                } else { //等待登录结束后执行
                    _LoginRequesting = true;
                    _LRCallBack = loginMethod().then(function () {
                        _LoginRequesting = false;
                        YunGalaxyJSHelper.YeeOfficePostMethod(url, jsonData, isSync).then(function (data) {
                            _PostDtd.resolve(data)
                        });
                    });
                };
                return _PostDtd.promise();
            } else { //正常请求
                //if (window._KeepLoginState != undefined) {
                //    _KeepLoginState();
                //};
                return YunGalaxyJSHelper.YeeOfficePostMethod(url, jsonData, isSync);
            }
        },
        YeeOfficePostMethod: function (url, jsonData, isSync) {
            if ($.cookie("LoginToken")) {
                if (jsonData == undefined) {
                    jsonData = {
                        LoginToken: $.cookie("LoginToken")
                    };
                } else {
                    jsonData = YunGalaxyJSHelper.evalJSON(jsonData);
                    $.extend(jsonData, {
                        LoginToken: $.cookie("LoginToken")
                    });
                };

                jsonData = YunGalaxyJSHelper.JSONstringify(jsonData);
            } else {

            }
            jQuery.support.cors = true;

            return $.ajax({
                crossDomain: true,
                url: url,
                type: 'POST',
                cache: false,
                headers: {
                    "AkmiiSecret": $.cookie("LoginSecret")
                },
                contentType: "application/json,charset=utf-8",
                dataType: 'json',
                data: jsonData,
                async: (isSync == undefined ? true : isSync)
            });
        },
        PutMethod: function (url, jsonData) { //向服务器发送PUT类型的请求
            var options = {
                type: 'PUT',
            };
            $.extend(options, {
                url: url,
                data: jsonData
            });
            return $.ajax(options);
        },
        GETMethod: function (url, isSync, dataType) { //向服务器发送Get类型的请求
            var options = {
                type: 'GET',
                cache: false,
                dataType: dataType == undefined ? "json" : dataType,
                async: (isSync == undefined ? true : isSync)
            };
            $.extend(options, {
                url: url
            });
            return $.ajax(options);
        },
        DeleteMethod: function (url, isSync) { //向服务器发送DELETE类型的请求
            var options = {
                type: 'DELETE',
                async: (isSync == undefined ? true : isSync)
            };
            $.extend(options, {
                url: url
            });
            return $.ajax(options);
        },
        GetQueryString: function (name) { //获取当前URL的参数
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
            var r = window.location.search.substr(1).match(reg);
            if (r != null) return unescape(r[2]);
            return null;
        },
        DebugLog: function (message) { //兼容浏览器的写日志
            try {
                if (window.console) {
                    window.console.log(message);
                }
            } catch (e) { }
        },
        GetEnumText: function (enumModel, value) { //根据枚举来获取对应text
            for (var i = 0; i < enumModel.length; i++) {
                if (enumModel[i].value == value) {
                    return enumModel[i].text;
                };
            };
        },
        GetEnumValue: function (enumModel, text) { //根据枚举来获取对应value
            for (var i = 0; i < enumModel.length; i++) {
                if (enumModel[i].text == text) {
                    return enumModel[i].value;
                };
            };
        },
        ResizeManagePlanAppPart: function (topDom) { //重新设置当前窗体的大小,通过postmessage
            if (window.parent == null)
                return;
            // Extracts the host url and sender Id  values from the query string. 
            topDom.hostUrl = YunGalaxyJSHelper.GetQueryString("sphosturl");
            topDom.senderId = YunGalaxyJSHelper.GetQueryString("senderid");
            if (topDom.hostUrl == null || topDom.senderId == null) {
                return;
            };
            var height = jQuery('#formManagePlan').height();
            var width = jQuery('#leaderContainer').width();
            //use postmessage to resize the app part. 

            var message = "<Message senderId=" + topDom.senderId + " >" + "resize(" + width + "," + height + ")</Message>";
            window.parent.postMessage(message, topDom.hostUrl);
        },
        WeekOfTheYear: function (datetime) { //获取当前时间是今年的第几周如果不穿,则默认当前时间
            var totalDays = 0;
            now = (datetime == undefined ? new Date() : new Date(datetime));
            years = now.getYear()
            if (years < 1000)
                years += 1900
            var days = new Array(12);
            days[0] = 31;
            days[2] = 31;
            days[3] = 30;
            days[4] = 31;
            days[5] = 30;
            days[6] = 31;
            days[7] = 31;
            days[8] = 30;
            days[9] = 31;
            days[10] = 30;
            days[11] = 31;

            //判断是否为闰年，针对2月的天数进行计算
            if (Math.round(now.getYear() / 4) == now.getYear() / 4) {
                days[1] = 29
            } else {
                days[1] = 28
            }

            if (now.getMonth() == 0) {
                totalDays = totalDays + now.getDate();
            } else {
                var curMonth = now.getMonth();
                for (var count = 1; count <= curMonth; count++) {
                    totalDays = totalDays + days[count - 1];
                }
                totalDays = totalDays + now.getDate();
            }
            //得到第几周
            var week = Math.round(totalDays / 7) + 1;
            return week;
        },
        LockAllControl: function () { //禁用所有控件
            $("input").attr("disabled", "disabled");
            $("select").attr("disabled", "disabled");
            $("textarea").attr("disabled", "disabled");
        },
        UnLockAllControl: function () { //解锁所有控件
            $("input").removeAttr("disabled");
            $("select").removeAttr("disabled");
            $("textarea").removeAttr("disabled");
        },
        ConvertToChinaNumber: function (number) { //将数字转化为汉字
            if (number == null || number == undefined) {
                return ""
            };
            var chinaWord = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
            var lengthWord = ['', '十', '百', '千', '万'];
            var numberString = number.toString();
            var result = "";
            for (var i = 0, j = numberString.length - 1; i < numberString.length; i++ , j--) {
                result += chinaWord[numberString.charAt(i)];
                result += lengthWord[j];
            };
            return result;
        },
        NewDate: function (dateStringInRange) { //转换日期字符串至日期格式,兼容模式
            var isoExp = /^\s*(\d{4})-(\d\d)-(\d\d)\s*$/,
                date = new Date(NaN),
                month,
                parts = isoExp.exec(dateStringInRange);
            if (parts) {
                month = +parts[2];
                date.setFullYear(parts[1], month - 1, parts[3]);
                if (month != date.getMonth() + 1) {
                    date.setTime(NaN);
                }
            }
            return date;
        },
        GetDateStr: function (addDayCount, baseDate) { //给某个时间加上一个日期
            var dd = baseDate || new Date();
            dd.setDate(dd.getDate() + addDayCount);
            var y = dd.getFullYear();
            var m = dd.getMonth() + 1;
            var d = dd.getDate();
            return y + "/" + m + "/" + d;
        },
        StructModel: function (Dom, NameSpace, FieldsList) { //自动构造某一个数据模型,
            var currentNameSpace = Dom;
            for (var i = 0; i < NameSpace.split(".").length; i++) {
                var current = NameSpace.split(".")[i];
                if (i == NameSpace.split(".").length - 1) {
                    currentNameSpace[current] = function () {
                        var modelPrototype = new Object();
                        for (var i = 0; i < FieldsList.split(",").length; i++) {
                            var thisLoop = FieldsList.split(",")[i].trim();
                            if (!modelPrototype[thisLoop]) {
                                modelPrototype[thisLoop] = "";
                            };
                        };
                        return modelPrototype;
                    };
                } else if (!currentNameSpace[current]) {
                    currentNameSpace[current] = {};
                };
                currentNameSpace = currentNameSpace[current];
            };
        },
        SetModelValue: function (Model, FieldsList, Data) { //自动为某一个模型赋值

            for (var i = 0; i < FieldsList.split(",").length; i++) {
                var thisLoop = FieldsList.split(",")[i].trim();
                if (!Model[thisLoop]) {
                    Model[thisLoop] = Data.thisLoop;
                };
            };
        },
        StructKnockOutModel: function (Dom, NameSpace, FieldsList) { //自动构造某一个数据模型,请将NameSpace以使用.分割,FieldsList用,分割
            var currentNameSpace = Dom;
            for (var i = 0; i < NameSpace.split(".").length; i++) {
                var current = NameSpace.split(".")[i];
                if (i == NameSpace.split(".").length - 1) {
                    currentNameSpace[current] = function () {
                        var modelPrototype = new Object();
                        for (var i = 0; i < FieldsList.split(",").length; i++) {
                            var thisLoop = FieldsList.split(",")[i].trim();
                            if (!modelPrototype[thisLoop]) {
                                modelPrototype[thisLoop] = ko.observable();
                            };
                        };
                        return modelPrototype;
                    };
                } else if (!currentNameSpace[current]) {
                    currentNameSpace[current] = {};
                };
                currentNameSpace = currentNameSpace[current];
            };

        },
        SetKnockOutModelValue: function (Model, FieldsList, Data) { //自动为某一个模型赋值
            for (var i = 0; i < FieldsList.split(",").length; i++) {
                var thisLoop = FieldsList.split(",")[i].trim();
                if (Model[thisLoop]) {
                    Model[thisLoop](Data[thisLoop]);
                };
            };
        },
        ImportExcelSync: function (element, apiUrl, SuccessEvent, FaildEvent) {
            var file = $('#' + element)[0].files[0];
            var fileName = file.name;
            var fileExted = fileName.substr(fileName.lastIndexOf("."));
            if (fileExted.toUpperCase() != ".XLS" && fileExted.toUpperCase() != ".XLSX") {
                Akmii.UI.warning("只能选择Excel文件，请重新选择文件！");
                return false;
            }
            var formData = new FormData();
            formData.append('file', file);
            formData.append("LoginToken", $.cookie("LoginToken"));
            $.ajax({
                url: apiUrl,
                type: 'POST',
                cache: false,
                data: formData,
                processData: false,
                contentType: false
            }).done(function (res) {
                if (SuccessEvent) {
                    SuccessEvent(res);
                }
            }).fail(function (res) {
                if (FaildEvent) {
                    FaildEvent(res);
                } else {
                    Akmii.UI.error("服务请求错误！");
                }
            });
        },
        /*
          options:
              - browse_button 点击可以选择文件的HTML元素ID.默认：file
              - tip_Area,上传文件时提示的区域
              - url:上传文件的接口地址
              - mime_types:用来限定上传文件的类型,为一个数组，该数组的每个元素又是一个对象，该对象有title和extensions两个属性，title为该过滤器的名称，extensions为文件扩展名，有多个时用逗号隔开。该属性默认为一个空数组，即不做限制。
              - PostInit:当Init事件发生后触发
              - FilesAdded:当文件添加到上传队列后触发
              - UploadProgress:会在文件上传过程中不断触发，可以用此事件来显示上传进度
              - FileUploaded:当队列中的某一个文件上传完成后触发
              - Error:当发生错误时触发
        */
        UploadFileSync: function (options) {
            var uploader = new plupload.Uploader({
                runtimes: 'html5,flash,silverlight,html4',
                browse_button: options.browse_button || "btnUploadFile",
                url: options.url ? options.url : window["FilecenterUrl"] + "/api/File/AddFile",
                flash_swf_url: window["CDN"] + '/images/Moxie.swf',
                silverlight_xap_url: window["CDN"] + '/images/Moxie.xap',
                filters: {
                    max_file_size: '10mb',
                    //prevent_duplicates : true,
                    mime_types: options.mime_types
                },
                init: {
                    PostInit: function () {
                        if (options.PostInit) {
                            options.PostInit();
                        }
                    },
                    FilesAdded: function (up, files) {
                        //plupload.each(files, function (file) {
                        //    document.getElementById('filelist').innerHTML += '<div id="' + file.id + '">' + file.name + ' (' + plupload.formatSize(file.size) + ') <b></b></div>';
                        //});
                        $(options.tip_Area).mask("uploading");
                        if (options.FilesAdded) {
                            options.FilesAdded(up, files);
                        } else {
                            uploader.start(); //开始上传文件
                        }
                    },
                    UploadProgress: function (up, file) {
                        if (options.UploadProgress) {
                            options.UploadProgress(up, file);
                        }
                    },
                    FileUploaded: function (a, b, c) {
                        if (options.FileUploaded) {
                            var dd = $.parseJSON(c.response);
                            dd.filePath = dd.filePath.substr(dd.filePath.indexOf(":") + 1);
                            options.FileUploaded(a, b, {
                                response: JSON.stringify(dd)
                            }, $(options.tip_Area));
                        }
                    },
                    Error: function (up, err) {
                        if (options.Error) {
                            options.Error(up, err);
                        } else {
                            YunGalaxyJSHelper.DebugLog("\nError #" + err.code + ": " + err.message);
                        }
                    }
                }
            });
            uploader.init();
        },
        GetAPIUrlDomain: function (url) {
            return url.substr(0, url.indexOf("/_API"));
        },
    })
})("YunGalaxyJSHelper")