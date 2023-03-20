
/* TODO...document me
*/
const MyProfileProviderFactory = {
  id: 'acada807-786e-4bdc-9609-54522396c786',
  description: 'Load profiles from our fictitious API',
  createProvider(jancy, state=null) {
    return new MyProfileProvider(jancy, state)
  },
  addProvider(jancy, browserWindow) {
    dialog(jancy, browserWindow)
  },
  editProvider(jancy, browserWindow, provider) {
    dialog(jancy, browserWindow, provider)
  }
}


/* The ProfileProvider class that knows how to connect to
** our fictitious API, query it, and turn the retrieved data
** into Jancy profiles.
*/
class MyProfileProvider {

  constructor(jancy, { url = null, name = null }) {
    this.jancy = jancy
    this.url = url
    this.name = name ? name : url
    this.groupCount = 0
    this.profileCount = 0
    this.state = 0
  }

  /* Connect to and query the API at "this.url".
  **
  ** Arguments:
  **    providerId (string)
  **
  ** Returns a promise that should resolve with a boolean to indicate
  ** success or failure.
  */
  loadProfiles(providerId) {
    return new Promise(async (resolve, reject) => {

      this.groupCount = 0
      this.profileCount = 0

      let profiles = []

      /* The following is a deomonstration of what you'd do in Jancy to connect to
      ** the API at this.url (our fictitious API endpoint) using AXIOS.
      **
      ** 
      ** try {
      **   const r = await this.jancy.axios.get(this.url)
      **   if (r.status === 200) {
      **     profiles = res.data
      **   } else {
      **     this.state = 2   // error
      **     resolve(false)
      **     return
      **   }
      ** } catch(err) {
      **    this.state = 2    // error
      **    resolve(false)
      **   return
      ** }
      */

      /* Lets pretend the API returned a couple of profiles in some proprietary format... 
      */
      profiles = [
        {
          firstName: "Michaela",
          lastName: "Trombly",
          email: 'MichaelaCTrombly@rhyta.com',
          address: "1883 Birch  Street",
          city: "El Paso",
          state: "TX",
          zip: "79936",
          phone: "1112223333",
          password: "my-tm-password",   // Ticketmaster password
          bank: "Comdata",
          creditCard: "311111111111111",
          creditCardCVV: "1111",
          creditCardExpDate: "3/26"
        },
        {
          firstName: "Paula",
          lastName: "Russell",
          email: 'PaulaARussell@teleworm.us',
          address: "2527 Anthony Avenue",
          city: "Eldorado",
          state: "TX",
          zip: "79936",
          phone: "1112223333",
          password: "my-tm-password",     // Ticketmaster password
          bank: "Citi Bank",
          creditCard: "311111111111112",
          creditCardCVV: "2222",
          creditCardExpDate: "3/27"
        }
      ]

      /* In order to add these profiles to Jancy first we need to construct profiles suitable for
      ** Jancy from this profile data.
      */
      profiles.forEach(profile => {

        const p = this.jancy.profileFactory.create({
          providerId,
          groupName: profile.bank,      // we use bank as a group name in Jancy
          profileName: `${ profile.firstName } ${ profile.lastName }`,
          name: `${ profile.firstName } ${ profile.lastName }`,
          email: profile.email,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zip: profile.zip,
          phoneNumber: profile.phone
        })

        this.jancy.profileFactory.addCard(p, {
          number: profile.creditCard,
          cvv: profile.creditCardCVV,
          expDate: profile.creditCardExpDate
        })

        this.jancy.profileFactory.addSite(p, {
          site: 'ticketmaster',
          isPattern: false,
          fields: [
            {
              field: 'password',
              resolver: '$' + profile.password,
              resolverArgs: []
            }
          ]
        })

        /* We've created a Jancy profile object. Now we have to add it to the registry.
        ** We keep track of some stats so we can generate a good info string.
        */
        this.profileCount++
        if (this.jancy.profileRegistry.addProfile(p)) {
          this.groupCount++
        }
      })

      this.state = 999
      resolve(true)
    })
  }

  /* Returns the name of this provider.
  */
  getName() {
    return this.name
  }

  /* Return a human readable string that describes the current state of
  ** this provider.
  */
  getInfo() {
    switch(this.state) {
      case 0:
        return this.url ? 'No profiles loaded' : 'URL is not configured'
      case 1:
        return 'Press the reload button for changes to take effect'
      case 2:
        return `Error interactin with ${ this.url }`
      default:
        return `${ this.groupCount } profile groups containing ${ this.profileCount } profiles loaded from ${ this.url }`
    }
  }

  /* Return an object that can be fed back into the constructor to
  ** recreate this provider.
  */
  getState() {
    return {
      name: this.name,
      url: this.url
    }
  }

  /* Update this provider from the output of the dialog.
  **
  ** Arguments:
  **    args (object)
  **      url (string)
  */
  update(args) {
    this.name = args.name
    if (args.url !== this.url) {
      this.url = args.url
      this.state = 1
    }
  }
}


/* Display a dialog to either create this provider or edit an existing one.
**
** Arguments:
**    jancy (Jancy)
**    browserWindow (BrowserWindow)
**    provider (MyProfileProvider): optional
*/
function dialog (jancy, browserWindow, provider) {

  function escape(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /* Use the Jancy dialog factory to create a new dialog that
  ** will serve as an editor for our provider.
  */
  let providerWindow = jancy.dialogFactory.create(
    browserWindow, 
    {
      width: 400,
      height: 160,
      title: provider ? `Edit ${provider.name}` : 'Load profiles from a ficticious API',
    },
    {
      centerRelativeToParent: true
    }
  )

  /* Add a custom action to the Jancy action registry that will be used
  ** to save changes to the given "provider" instance. If the a provider
  ** instance is not give (because we're creating one) a new one will
  ** be created and added to the system. The action (my-provider:save)
  ** will be unregistered when the providerWindow closes.
  */
  jancy.actionRegistry.register("my-provider:save", (args, sender) => {
    if (provider) {
      provider.update(args)
      jancy.profileProviders.saveProvider(provider)
    } else {
      jancy.profileProviders.createProvider(MyProfileProviderFactory, args)
    }
  })

  /* When the provider window is ready to show, we add some css and our
  ** content.
  */
  providerWindow.once('ready-to-show', () => {

    /* This is some CSS we inject into our window.
    */
    const css = `
      p {
        padding: 5px 0;
      }

      .input-textfield {
        flex-grow: 1;
      }

      .button-container {
        width: 100%;
        justify-content: flex-end;
      }
    `

    providerWindow.webContents.insertCSS(css)

    /* Define some HTML that will serve as the content of our window.
    */
    const html = `
      <div class="block my-content">

        <p>
          Load profiles from an ARC Airtable CSV
        </p>

        <div class="block">

          <div class="inline-block">
            <label class="input-label">URL</label>
            <input class="input-textfield" name="url" value="${ provider ? escape(provider.url) : ""}" />
          </div>

          <div class="inline-block">
            <label class="input-label">Name</label>
            <input class="input-textfield" name="name" value="${ provider ? escape(provider.name) : ""}" />
          </div>
          
        </div>

        <div class="inline-block button-container">
          <button class="button" onclick="window.close()">Cancel</button>
          <button class="button" onclick="window.onSave()">${ provider ? "Update" : "Add" }</button>
        </div>

      </div>
    `

    /* Define a function that will be turned into a string, injected into providerWindow as an
    ** anonymous function that will be executed immediately.
    */
    const func = function(html) {

      window.onSave = (event) => {

        const name = document.body.querySelector('input[name="name"]').value
        const url = document.body.querySelector('input[name="url"]').value

        if (name.trim().length > 0 && url.trim().length > 0) {
          window.jancyAPI.dispatchAction("my-provider:save", {
            name,
            url
          })
          window.close()
        }
      }

      document.body.innerHTML = html
    }

    /* When providerWindow closes, we unregister our custom action.
    */
    providerWindow.on('close', () => {
      jancy.actionRegistry.unregister("my-provider:save")
    })
    
    /* Generate the code (turning func into a string) that we inject into the providerWindow.
    **
    ** The generated code will look something like this...
    **
    ** (function(html) {
    **    window.onSave = (event) => { ...
    ** })('<div class="block my-content"...')
    */
    const code = `
      (${ func.toString() })(${ JSON.stringify(html) })
    `

    providerWindow.webContents.executeJavaScript(code)

    /* Show our provider window.
    */
    providerWindow.show()
  })
}


module.exports = {

  /* jancy_props is an object used to communicate some useful infromation about
  ** your plugin to the Jancy plugin registry.
  **
  ** Required props:
  **    registryVersion (number) - tells Jancy what version of the plugin registry
  **                               this plugin was built against. Currently version
  **                               "1" is supported.
  **
  ** Optional props:
  **    enabled (boolean) - if false, tells Jancy to not enable your plugin by
  **                        default the first time it loads. Default is true.
  **
  */
  jancy_props: {
    registryVersion: 1,
  },

  /* --------------------------------------------------------------------------
  ** Called by the pluginRegistry when the user has enabled us and we
  ** were previously disabled.
  **
  ** This is a good opportunity to add things to Jancy that your plugin
  ** provides.
  **
  ** Arguments:
  **    jancy (object)
  ** ------------------------------------------------------------------------*/
  jancy_onEnabled(jancy) {
    jancy.profileProviderFactories.addFactory(MyProfileProviderFactory)
  },

  /* --------------------------------------------------------------------------
  ** Called by the pluginRegistry when the user has disabled us and
  ** we were previously enabled.
  **
  ** This is a good opportunity to remove things from Jancy that your plugin
  ** added.
  **
  ** Arguments:
  **    jancy (object)
  ** ------------------------------------------------------------------------*/
  jancy_onDisabled(jancy) {
    jancy.profileProviderFactories.removeFactory(MyProfileProviderFactory.id)
  },

  /* --------------------------------------------------------------------------
  ** jancy_onInit is called by the plugin registry when the plugin is loaded.
  **
  ** This is your first opportunity to iteract with Jancy.
  **
  ** Arguments:
  **    jancy (Object)
  **    enabled (boolean) -- is our plugin enabled
  ** ------------------------------------------------------------------------*/
  jancy_onInit(jancy, enabled) {
    if (enabled) {
      this.jancy_onEnabled(jancy)
    }
  }
}
