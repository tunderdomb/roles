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
    role.prototype = setup
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
/*
 * The following roles act as standalone user interface widgets
 * or as part of larger, compostabsete widgets.

 alert
 alertdialog
 button
 checkbox
 dialog
 gridcell
 link
 log
 marquee
 menutabsetem
 menutabsetemcheckbox
 menutabsetemradio
 option
 progressbar
 radio
 scrollbar
 slider
 spinbutton
 status
 tab
 tabpanel
 textbox
 timer
 tooltip
 treetabsetem
 * */
!function( win, doc, roles ){

  /*
   * tabset
   * natives: tablist, tab, tabpanel
   * customs: tabpool, addtab, closetab
   * defaults:
   * ...
   * abstracts:
   * ...
   * */
  roles.create({
    name: "tabset",
    defaults: {
      closable: false,
      onselect: null,
      onclose: null
    },
    add: function Tabset( el, options ){
      var i = -1
        , content, activeContent
        , tab, activeTab, tabs
        , tabset = this
        , content

      roles.extend(this, options)
      this.bar = roles.getRole(el, "tablist")
      if ( !this.bar ) return
      this.tabs = this.tabs || roles.findRoles(this.bar, "tab")
      tabs = this.tabs = [].slice.call(this.tabs)
      this.add = this.add || roles.getRole(this.bar, "addtab")
      this.pool = roles.getRole(el, "tabpool") || el
      this.contents = this.contents || roles.findRoles(this.pool, "tabpanel")
      if ( this.tabs.length && this.tabs.length != this.contents.length ) {
        console.error("Tab headers and content boxes differ in number")
        return
      }
      while ( tab = tabs[++i] ) {
        content = this.contents[i]
        if ( tab.hasAttribute(roles.attr.selected) ) {
          activeTab = tab
          activeContent = content
        }
/*        if ( content && !content.hasAttribute(roles.attr.hidden) ) {
          activeContent = content
//          activeTab = tab
        }*/
        this.addTab(tab, content)
      }
      this.activeTab = activeTab
      this.activeContent = activeContent
      if ( !activeTab ) {
        this.changeTo(0)
      }
      if ( this.add ) {
        roles.addListener(this.add, "click", function(){
          tabset.addTab()
        })
      }
      this.ready = true
    },
    createTab: function(){
    },
    createContent: function(){
    },
    createClose: function(){
    },
    addTab: function( tab, content ){
      var close
        , tabset = this

      if( this.ready && this.create ){
        tab = this.create.apply(this, arguments)
        if( !tab ) return
        content = tab[1]
        tab = tab[0]
      }

      tab = tab || this.createTab.apply(this, arguments)
      content = content || this.createContent.apply(this, arguments)
      if ( !content || !tab ) return

      if ( !~this.tabs.indexOf(tab) ) {
        this.tabs.push(tab)
        this.add
          ? this.bar.insertBefore(tab, this.add)
          : this.bar.appendChild(tab)
      }

      if ( !~this.contents.indexOf(content) ) {
        this.contents.push(content)
        this.pool.appendChild(content)
      }

      roles.addListener(tab, "click", function(){
        tabset.changeTo(tab)
      })

      if ( this.closable ) {
        close = roles.getRole(tab, "closetab")
        if ( !close ) {
          close = this.createClose.apply(this, arguments)
          if ( !close ) return
          tab.appendChild(close)
        }
        roles.addListener(close, "click", function(){
          if ( !tabset.onclose || tabset.onclose.call(this, tab, content) ) {
            tab.parentNode.removeChild(tab)
            content.parentNode.removeChild(content)
          }
        })
      }
      this.ready && this.changeTo(tab)
      if( this.focusElement ){
        this.focusElement.focus()
        delete this.focusElement
      }
    },
    changeTo: function( index ){
      var tab, content
      if ( index instanceof Node ) {
        index = this.tabs.indexOf(index)
      }
      if ( ~index && this.tabs[index] ) {
        tab = this.tabs[index]
        content = this.contents[index]
        if ( this.activeTab ) {
          roles.deselect(this.activeTab)
        }
        if ( this.activeContent ) {
          roles.hide(this.activeContent)
        }
        this.activeTab = tab
        this.activeContent = content
        roles.select(this.activeTab)
        roles.show(this.activeContent)
        this.onselect && this.onselect(tab, content)
      }
    },
    closeTab: function( index ){
      var i
      if ( index instanceof Node ) {
        i = this.tabs.indexOf(index)
        if ( !~i ) i = this.contents.indexOf(index)
      }
      if ( ~i && this.tabs[i] ) {
        this.tabs[i].parentNode.removeChild(this.tabs[i])
        this.contents[i].parentNode.removeChild(this.contents[i])
      }
    }
  })

}(window, document, window.roles);