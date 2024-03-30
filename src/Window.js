import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { Icon } from './Icon.js';

export const Window = GObject.registerClass({
	GTypeName: 'IcoWindow',
	Template: 'resource:///com/github/azuredusk10/IconManager/ui/Window.ui',
	InternalChildren: ['details_panel', 'main_panel', 'toast_overlay'],
	Properties: {
	  currentSetIcons: GObject.ParamSpec.object(
      'currentSetIcons',
      'Current Set Icons',
      'The list model containing the icons in the currently selected icon set',
      GObject.ParamFlags.READWRITE,
      Gio.ListStore
    ),
    currentSetName: GObject.ParamSpec.string(
      'currentSetName',
      'Current Set Name',
      'The name of the currently selected icon set',
      GObject.ParamFlags.READWRITE,
      ''
    ),
	}
}, class extends Adw.ApplicationWindow {
  constructor(params={}){
    super(params);
    this.#bindSizeToSettings();
    this.#setupActions();
    this.#initializeIcons();

  }

	vfunc_close_request() {
		super.vfunc_close_request();
		this.run_dispose();
	}


	#bindSizeToSettings(){
	  settings.bind('window-width', this, 'default-width', Gio.SettingsBindFlags.DEFAULT);
	  settings.bind('window-height', this, 'default-height', Gio.SettingsBindFlags.DEFAULT);
	}

	#setupActions(){
	  // Copy an icon to the clipboard.
	  // Not used right now, but will be useful when adding menus, and linking up "Copy to clipboard" buttons.
	  // Use a signal for the double-click action.
	  // @params [mimeType<String>, imageData<String>]
	  // TODO: The action on IconTile.ui context menu is greyed out because the parameter type isn't right. It thinks the action is a string (s), when it's actually an array of strings (as) or an object (a{ss}).
	  const copyIconAction = new Gio.SimpleAction({
	    name: 'copy-icon',
	    parameterType: GLib.VariantType.new('a{ss}'),
	  });

    copyIconAction.connect('activate', (_action, params) => {
      // Code to copy the item to the clipboard goes here

      console.log(params.recursiveUnpack());

      // Show toast
      const toast = new Adw.Toast({
        title: "SVG copied to clipboard",
        timeout: 3,
      });

      this._toast_overlay.add_toast(toast);
    });

    // Add action to window
	  this.add_action(copyIconAction);
	}


	#initializeIcons() {

    this.currentSetIcons = Gio.ListStore.new(Icon);

    const iconSetsDir = GLib.build_pathv('/', [GLib.get_home_dir(), '/icon-sets']);
    console.log(iconSetsDir);

    const carbonSetDir = GLib.build_pathv('/', [iconSetsDir, '/carbon']);
    console.log(carbonSetDir);

  		// Get an enumerator of all children
    	const children = Gio.File.new_for_path(carbonSetDir).enumerate_children('standard::*', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);


		let fileInfo;
		let i=0;
		while (fileInfo = children.next_file(null)) {
		  if(i < 50){
		    const label = fileInfo.get_display_name().replace(/\.[^/.]+$/, "");

		      const icon = new Icon({
		        label,
		        filepath: carbonSetDir + '/' + fileInfo.get_name(),
		      });

		      // Using the list store's splice method to add all icons at once would be more efficient.
		      this.currentSetIcons.append(icon);

		      i++;
	    }
		}

		// This will tell the Main Panel that the icons have been fully processed
		this.notify('currentSetIcons');

    // How to run a method on MainPanelView from here? This doesn't work
    // this._main_panel.#filterItems();
  }

	onIconActivated(emitter, filepath, label){
	  this._details_panel.filepath = filepath;
	  this._details_panel.label = label;
	}

});

