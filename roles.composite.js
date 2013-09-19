/*
 * The following roles act as composite user interface widgets. These roles typically act as containers that manage other, contained widgets.

 combobox
 grid
 listbox
 menu
 menubar
 radiogroup
 tablist
 tree
 treegrid
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
      drawer: false,
      onselect: null,
      onclose: null
    },
    add: function Tabset( el, options ){
      var i = -1
        , content, activeContent
        , tab, activeTab, tabs
        , tabset = this

      roles.extend(this, options)
      this.bar = roles.getRole(el, "tablist")
      if ( !this.bar ) return
      this.tabs = this.tabs || roles.findRoles(this.bar, "tab")
      tabs = this.tabs = [].slice.call(this.tabs)
      this.add = this.add || roles.getRole(this.bar, "addtab")
      this.pool = roles.getRole(el, "tabpool") || el
      this.contents = this.contents || roles.findRoles(this.pool, "tabpanel")
      if ( this.tabs.length && this.tabs.length != this.contents.length ) {
        console.error("Tab headers and content boxes differ in number", el)
        return
      }
      while ( tab = tabs[++i] ) {
        content = this.contents[i]
        if ( tab.hasAttribute(roles.attr.selected) ) {
          activeTab = tab
          activeContent = content
        }
        else roles.hide(content)

        this.addTab(tab, content)
      }
      this.activeTab = activeTab
      this.activeContent = activeContent
      /*if ( !activeTab ) {
       this.changeTo(0)
       }*/
      if ( this.add ) {
        roles.addListener(this.add, "click", function(){
          tabset.addTab()
        })
      }
      this.ready = true
    },
    addTab: function( tab, content, focusElement ){
      var close
        , tabset = this

      if( this.ready && this.create ){
        tab = this.create.apply(this, arguments)
        if( !tab ) return
        content = tab[1]
        tab = tab[0]
      }

      if ( !content || !tab ) return

      if ( !~this.tabs.indexOf(tab) ) {
        this.tabs.push(tab)
        if( !tab.parentNode ) this.add
          ? this.bar.insertBefore(tab, this.add)
          : this.bar.appendChild(tab)
      }

      if ( !~this.contents.indexOf(content) ) {
        this.contents.push(content)
        if( !content.parentNode ) this.pool.appendChild(content)
      }

      roles.addListener(tab, "click", function(){
        tabset.changeTo(tab)
      })

      if ( this.closable ) {
        close = roles.getRole(tab, "closetab")
        if ( !close ) return
        roles.addListener(close, "click", function(){
          if ( !tabset.onclose || tabset.onclose.call(this, tab, content) ) {
            tab.parentNode.removeChild(tab)
            content.parentNode.removeChild(content)
          }
        })
      }
      this.ready && this.changeTo(tab)
    },
    getTab: function( index ){
      var i = index
      if ( index instanceof Node ) {
        i = this.tabs.indexOf(index)
        if ( !~i ) i = this.contents.indexOf(index)
        return ~i ? i : false
      }
      return this.tabs[i] && this.contents[i] ? i : false
    },
    changeTo: function( index ){
      var tab, content
      index = this.getTab(index)
      if( index === false ) return
      tab = this.tabs[index]
      content = this.contents[index]
      if( this.drawer ) {
        if( this.activeTab == tab && this.activeContent == content ) {
          roles.deselect(this.activeTab)
          roles.hide(this.activeContent)
          this.activeTab = this.activeContent = null
          return
        }
      }

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
    },
    hideTab: function( index ){
      var tab, content
      index = this.getTab(index)
      if( index === false ) return
      tab = this.tabs[index]
      content = this.contents[index]
      roles.hide(content)
      roles.deselect(tab)
      if ( this.activeTab == tab ) {
        this.activeTab = null
      }
      if ( this.activeContent == content ) {
        this.activeContent = null
      }
    },
    hideTabs: function(  ){
      for ( var i = -1, l = this.tabs.length; ++i < l; ) {
        this.hideTab(i)
      }
    },
    closeTab: function( index ){
      var i
      if ( index instanceof Node ) {
        i = this.tabs.indexOf(index)
        if ( !~i ) i = this.contents.indexOf(index)
        if( !~i ) return
      }
      if( this.tabs[i] ) {
        this.tabs[i].parentNode && this.tabs[i].parentNode.removeChild(this.tabs[i])
        this.tabs.splice(i, 1)
      }
      if( this.contents[i] ) {
        this.contents[i].parentNode && this.contents[i].parentNode.removeChild(this.contents[i])
        this.contents.splice(i, 1)
      }
    },
    hasTab: function( tabOrContent ){
      var i = this.tabs.indexOf(tabOrContent)
      if( !~i ) i = this.contents.indexOf(tabOrContent)
      return !!~i
    }
  })

}(window, document, window.roles);