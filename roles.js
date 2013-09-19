!function( win, doc, host ){

  var roles = {
      ROLE_ATTR: "role",
      attr: {
        selected: "aria-selected",
        hidden: "aria-hidden",
        invalid: "aria-invalid"
      }
    }
    , listenerMethod = win.addEventListener ? "addEventListener" : "attachEvent"
    , removeListenerMethod = win.addEventListener ? "removeEventListener" : "detachEvent"


  /*
   * UTILITIES
   * */
  function merge( defaults, options ){
    var setup = {}, setting
    options = options || {}
    for ( setting in defaults ) setup[setting] = defaults[setting];
    for ( setting in options ) setup[setting] = options[setting];
    return setup
  }

  function extend( object, extension ){
    for ( var property in extension ) object[property] = extension[property];
    return object
  }

  function addListener( element, types, cb, capture ){
    var el, ei
      , type
      , i, l
    capture = capture || false
    if ( !cb && typeof types != "string" ) {
      for ( type in types ) {
        addListener(element, type, types[type], capture)
      }
      return
    }
    types = types.split(/\s+/)
    if ( element[0] ) {
      for ( ei = -1, el = el.length; ++ei < el; ) {
        for ( i = -1, l = types.length; ++i < l; ) {
          type = types[i]
          element[ei][listenerMethod](type, cb, capture)
        }
      }
    }
    else {
      for ( i = -1, l = types.length; ++i < l; ) {
        type = types[i]
        element[listenerMethod](type, cb, capture)
      }
    }
  }

  function removeListener( element, types, cb, capture ){
    var el, ei, el
      , type
      , i, l
    capture = capture || false
    if ( !cb && typeof types != "string" ) {
      for ( type in types ) {
        removeListener(element, type, types[type], capture)
      }
      return
    }
    types = types.split(/\s+/)
    if ( element[0] ) {
      for ( ei = -1, el = element.length; ++ei < el; ) {
        for ( i = -1, l = types.length; ++i < l; ) {
          type = types[i]
          element[ei][removeListenerMethod](type, cb, capture)
        }
      }
    }
    else {
      for ( i = -1, l = types.length; ++i < l; ) {
        type = types[i]
        element[removeListenerMethod](type, cb, capture)
      }
    }
  }

  /* ======================
   * EventStation
   * ====================== */
  function EventStation(){}
  EventStation.prototype = {
    on: function ( event, listener ){
      this.events = this.events || {}
      if ( typeof event != "string" ) {
        var e
        if ( event.length ) while ( e = event.shift() ) {
          this.on(e, listener)
        }
        return
      }
      this.events[event] = this.events[event] || []
      if ( !~this.events[event].indexOf(listener) )
        this.events[event].push(listener)
    },
    off: function ( event, listener ){
      var i
      if ( !this.events || !this.events[event] ) return
      i = this.events[event].indexOf(listener)
      if ( !~i ) return
      this.events[event].splice(i, 1)
    },
    broadcast: function ( event, message ){
      if ( !this.events || !this.events[event] ) return
      var i = -1
        , events = this.events[event]
        , l
        , remove
      message = [].slice.call(arguments, 1)
      while ( ++i < events.length ) {
        l = events.length
        remove = events[i].apply(undefined, message) === false
        if ( remove ) {
          if ( l == events.length ) events.splice(i--, 1)
          else --i
        }
        else if ( l != events.length ) --i
      }
    }
  }

  /*
   * ROLE FUNCTIONS
   * */
  function hasRole( el, role ){
    return el.hasAttribute(roles.ROLE_ATTR)
      && (role
      ? new RegExp("(?:^.*?\\s|^)" + role + "(?:\\s+.*$|$)").test(el.getAttribute(roles.ROLE_ATTR))
      : true)
  }

  /*
   * filters the node tree recursively with a filter function
   * if deep is true, the matched nodes' subtrees will be searched too
   * otherwise only first level nodes will be returned
   * */
  function filterElements( element, filter, deep ){
    var children = element.children || element
      , i = -1
      , l = children.length
      , ret = []
    while ( ++i < l ) {
      if ( filter(children[i], ret) ) {
        ret.push(children[i])
        if ( deep && children[i].children.length ) {
          ret = ret.concat(filterElements(children[i].children, filter))
        }
      }
      else {
        ret = ret.concat(filterElements(children[i].children, filter))
      }
    }
    return ret
  }

  function findFirst( element, filter ){
    var children = element.children || element
      , i = -1
      , l = children.length
      , ret
    while ( ++i < l ) {
      if ( ret = filter(children[i]) ) {
        return ret
      }
      if ( children[i].children.length ) {
        if ( ret = filterElements(children[i].children, filter) ) {
          return ret
        }
      }
    }
  }

  function findRoles( el, role, deep ){
    var xp

    if ( !role && deep && el.querySelectorAll ) {
      return el.querySelectorAll("[" + roles.ROLE_ATTR + "]")
    }
    if ( role ) {
      xp = new RegExp("(?:^.*?\\s|^)" + role + "(?:\\s+.*$|$)")
      return filterElements(el, function( node ){
        return xp.test(node.getAttribute(roles.ROLE_ATTR) || "")
      }, deep)
    }
    else {
      return filterElements(el, function( node ){
        return node.hasAttribute(roles.ROLE_ATTR)
      }, deep)
    }
  }

  function getRole( el, role ){
    var xp

    if ( el.querySelector ) {
      return el.querySelector("[" + roles.ROLE_ATTR + "*=" + role + "]")
    }

    xp = new RegExp("(?:^.*?\\s|^)" + role + "(?:\\s+.*$|$)")
    return findFirst(el, function( node ){
      return xp.test(node.getAttribute(roles.ROLE_ATTR) || "") && node
    })
  }

  /**
   * creates a role with the given name
   * the add function gets called as a constructor when adding a new role with the element as the only attribute
   * the defaults object gets assigned to the role instance so its values can be modified later
   *
   * every other property will become the prototype of the role constructor,
   * and the previous values will be deleted
   *
   * setup{
   *   name: string
   *   defaults: object
   *   add: function( elementNode )
   *   remove: function() optional
   *   [...] prototype methods
   * }
   * @param setup
   */
  function createRole( setup ){
    var role = setup.add
      , name = setup.name
    roles[name] = function( el, options ){
      return new role(el, merge(roles[name].defaults, options))
    }
    roles[name].defaults = setup.defaults
    delete setup.add
    delete setup.name
    delete setup.defaults
    role.prototype = extend(setup, EventStation.prototype)
  }

  /**
   * looks for option values in the dataset object, among attributes
   * counts possible prefixed and non prefixed values too
   * @param el
   * @param roleName
   * @return {Object}
   */
  function findOptions( el, roleName ){
    var options = {}
      , defaults = roles[roleName].defaults
      , prefixed = roleName + "-"
      , prefixedData = "data-" + prefixed
    for ( var prop in defaults ) {
      if ( el.hasAttribute(prop) ) {
        options[prop] = el.getAttribute(prop)
      }
      else if ( el.hasAttribute(prefixed + prop) ) {
        options[prop] = el.getAttribute(prefixed + prop)
      }
      else if ( el.hasAttribute(prefixedData + prop) ) {
        options[prop] = el.getAttribute(prefixedData + prop)
      }
    }
    return options
  }

  function addRole( el, roleName, options ){
    if ( !roles[roleName] ) {
      //      !/\:/.test(roleName) && console.warn(el, "missing role", roleName)
      return false
    }
    options = options || findOptions(el, roleName)
    //    debugger;
    removeRole(el, roleName)
    return roles[roleName](el, options)
  }

  function removeRole( el, roleName ){
    var role = el.getAttribute("role")
    if( role ) el.setAttribute("role", role.replace(new RegExp("(^|\\s)"+roleName+"(\\s|$)|^\\s+|\\s+$", 'g'), " ").replace(/\s+/g, " "))
  }
  function removeRoles( elArray, roleName ){
    if( !elArray ) return
    var i = -1
      , l = elArray.length
    while( ++i<l ){
      removeRole(elArray[i], roleName)
    }
  }

  function applyRole( el ){
    var roleList = el.getAttribute(roles.ROLE_ATTR)
    if( !roleList ) return
    roleList = roleList.split(/\s+/)
    for ( var i = -1, l = roleList.length; ++i < l; ) {
      addRole(el, roleList[i])
    }
  }

  function autoApply( el, deep ){
    var elements = scanRoles(el, deep)
    for ( var i = -1, l = elements.length; ++i < l; ) {
      applyRole(elements[i])
    }
    applyRole(el)
  }

  function scanRoles( el, deep ){
    return findRoles(el, null, deep)
  }

  roles.show = function( el ){
    el.removeAttribute(roles.attr.hidden)
  }
  roles.hide = function( el ){
    el.setAttribute(roles.attr.hidden, true)
  }
  roles.isHidden = function( el ){
    return el.hasAttribute(roles.attr.hidden)
  }
  roles.select = function( el ){
    el.setAttribute(roles.attr.selected, true)
  }
  roles.isSelected = function( el ){
    return el.hasAttribute(roles.attr.selected)
  }
  roles.deselect = function( el ){
    el.removeAttribute(roles.attr.selected)
  }
  roles.validate = function( el, validator ){
    var valid = (validator === true ? true
      : validator === false ? false
      : el.pattern ? (new RegExp(el.pattern)).test(el.value)
      : typeof validator == "function" ? validator(el)
      : validator)
    valid ? el.removeAttribute(roles.attr.invalid)
      : el.setAttribute(roles.attr.invalid, true)
    return valid
  }
  roles.isValid = function( el ){
    return el.hasAttribute(roles.attr.invalid)
  }

  roles.merge = merge
  roles.extend = extend
  roles.addListener = addListener
  roles.removeListener = removeListener

  roles.scan = scanRoles
  roles.apply = applyRole
  roles.auto = autoApply

  roles.create = createRole
  roles.add = addRole

  roles.findOptions = findOptions
  roles.findRoles = findRoles
  roles.removeRole = removeRole
  roles.removeRoles = removeRoles
  roles.getRole = getRole
  roles.hasRole = hasRole

  host.roles = roles
}(window, window.document, this);