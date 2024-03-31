import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import GLib from 'gi://GLib';

import { drawSvg } from './drawSvg.js';


export const IconTile = GObject.registerClass({
  GTypeName: 'IcoIconTile',
  Template: 'resource:///com/github/azuredusk10/IconManager/ui/IconTile.ui',
  Properties: {
    Filepath: GObject.ParamSpec.string(
      'filepath',
      'Filepath',
      'The filepath to the icon image to be displayed',
      GObject.ParamFlags.READWRITE,
      ''
    ),
    Label: GObject.ParamSpec.string(
      'label',
      'Label',
      'The icon label',
      GObject.ParamFlags.READWRITE,
      ''
    ),
    width: GObject.ParamSpec.double(
      'width',
      'Width',
      'Width to render the icon at in pixels',
      GObject.ParamFlags.READWRITE,
      Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER,
      24
    ),
    height: GObject.ParamSpec.double(
      'height',
      'Height',
      'Height to render the icon at in pixels',
      GObject.ParamFlags.READWRITE,
      Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER,
      24
    ),
  },
  InternalChildren: ['icon_tile_popover_menu', 'icon_box', 'icon_label'],
  Signals: {
    'icon-copied': {
      param_types: [GObject.TYPE_STRING, GObject.TYPE_STRING]
    },
  }
}, class extends Gtk.FlowBoxChild{
  constructor(params){
    super(params);
    this.#renderIcon();
    this.connect('notify::width', () => {
      console.log('width of IconTile changed');
    })
  }

  onRightClick(_self, _n_press, x, y) {
    const position = new Gdk.Rectangle({ x: x, y: y });
    this._icon_tile_popover_menu.pointing_to = position;
    this._icon_tile_popover_menu.popup();
  }

  onLeftClick(_self, _n_press, x, y){
    if(_n_press == 2){
      console.log('tile double-clicked');

      this.emit('icon-copied', 'image/svg+xml', 'data goes here');
    }
  }

  #renderIcon(){
    const svgWidget = new Gtk.DrawingArea({
      widthRequest: this.width,
      heightRequest: this.height,
      marginTop: 8,
      marginBottom: 8,
      cssClasses: ['icon-grid__image'],
    })

    svgWidget.set_draw_func((widget, cr, width, height) => drawSvg(widget, cr, width, height, this.filepath));

    svgWidget.insert_before(this._icon_box, this._icon_label);
  }


} );
