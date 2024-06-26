import Rsvg from 'gi://Rsvg';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GdkPixbuf from 'gi://GdkPixbuf';

/**
* Guess which style an icon is.
* @param {Gio.File} gFile - the Gio.File object that references the SVG image
* @param {string} folderName - the name of the parent folder the icon is in
* @returns {number} 0 = undefined; 1 = outline; 2 = filled; 3 = duotone; 4 = color
**/
export const estimateIconStyle = (gFile, folderName = '') => {
  const [, contents] = gFile.load_contents(null);
  const stringContents = new TextDecoder().decode(contents);

  // Get the filename and remove .svg to get the icon name.
  const iconName = gFile.get_basename().replace(/\.[^/.]+$/, "");

  // Try guessing the icon's style from the name of its parent folder
  const outlineFolderMatches = folderName.match(/outline/i) || [];
  const filledFolderMatches = folderName.match(/fill|solid/i) || [];
  const duotoneFolderMatches = folderName.match(/twotone|duotone/i) || [];

  if(outlineFolderMatches.length > 0){
    return 1;
  } else if(filledFolderMatches.length > 0){
    return 2;
  } else if(duotoneFolderMatches.length > 0){
    return 3;
  }

  // Otherwise, check how many colours it has to check if it's duotone or color.
  const uniqueColors = countUniqueColorsFromString(stringContents);

  if(uniqueColors > 2){
    // It has multiple colors, it's a color icon
    return 4;

  } else if(uniqueColors == 2){
    // It has 2 colors, it's a duotone icon
    return 3;
  }

  // Otherwise, check its name for "duotone" at the end.
  // Some duotone icons use a single fill with multiple opacities, so just detecting the number of fills alone won't identify this type of duotone icon.
  const duotoneFileMatches = iconName.match(/(duotone)$/i) || [];

  if(duotoneFileMatches.length > 0){
    return 3;
  }

  // Otherwise, check its name for "fill", "filled", or "solid" at the end.
  const filledFileMatches = iconName.match(/(fill|filled|solid)$/i) || [];

  if(filledFileMatches.length > 0){
    return 2;
  }


  // If all else fails, assume it's an outline icon.
  return 1;


  /*
  // Otherwise, try guessing the icon's style from its SVG attributes
  // Detect if a "stroke" attribute is present, but not if it's followed by "none"
  const strokeMatches = stringContents.match(/\bstroke=(?!"none")/g) || [];
  // console.log('stroke matches', strokeMatches.length);

  // Detect if a "fill" attribute is present, but not if it's followed by "none"
  const fillMatches = stringContents.match(/\bfill=(?!"none")/g) || [];
  // console.log('fill matches', fillMatches.length);

  // Detect the number of colours present
  const uniqueColors = countUniqueColorsFromString(stringContents);
  // console.log('colors', uniqueColors)

  if(uniqueColors > 2){
    // It has multiple colors, it's a color icon
    return 4;

  } else if(uniqueColors == 2){
    // It has 2 colors, it's a duotone icon
    return 3;

  } else if(fillMatches.length > 0){
    // It has at least 1 fill, it's a filled icon
    return 2;

  } else if(strokeMatches.length > 0){
    // It contains no fills, only strokes; it's an outlined icon
    return 1;

  }

  return 0;
  */

}

const countUniqueColorsFromString = (str) => {
  // Regular expression to match hex color codes
  // Source: https://stackoverflow.com/a/53330328
  const hexColorRegex = /#(?:(?:[\da-f]{3}){1,2}|(?:[\da-f]{4}){1,2})/gi;

  // Find all matches of hex color codes in the string
  const matches = str.match(hexColorRegex) || [];

  // Create a Set to store unique colors
  const uniqueColors = new Set(matches.map(match => match.replace('#', '')));

  // Check if "currentColor" is present in the string and count it as an additional color
  if (/\bcurrentColor\b/i.test(str)) {
    uniqueColors.add('currentColor');
  }

  // Return the size of the Set (number of unique colors)
  return uniqueColors.size;
}


/**
* Draw an SVG from a Gio.File
* @param [unused]
* @param {Cairo} cr - the Cairo instance to use to draw the SVG
* @param {number} width - the pixel width to draw the SVG at
* @param {number} height - the pixel height to draw the SVG at
* @param {Gio.File} gfile - the Gio.File object that references the SVG
*
* @returns Rsvg.Handle
**/
export const drawSvg = (widget, cr, width, height, gfile) => {

    // Create an Rsvg handle
    const rsvgHandle = Rsvg.Handle.new_from_gfile_sync(gfile, 0, null);

    // const width = widget.get_allocated_width();
    // const height = widget.get_allocated_height();

    // Set the viewport width and height
    const viewport = new Rsvg.Rectangle({
      x: 0,
      y: 0,
      width,
      height,
    });

    // Render the SVG
    return rsvgHandle.render_document(cr, viewport);
  };


  /** Recursively delete all files and folders inside a given folder
  * @param {String} folderPath - path to the root folder to delete
  * @param {Boolean} deleteRootFolder - whether to delete the root folder at the end of the operation
  **/
 export const deleteRecursively = async (folderPath, deleteRootFolder = false) => {
  console.log('deleting recursively: ' + folderPath);
    try {
        const file = Gio.File.new_for_path(folderPath);
        const iter = await file.enumerate_children_async(
            'standard::name,standard::type',
            Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
            GLib.PRIORITY_DEFAULT,
            null
        );

        for await (const info of iter) {
            const childFile = iter.get_child(info);
            const fileType = info.get_file_type();
            console.log('child file path: ' + childFile.get_path());

            if (fileType === Gio.FileType.DIRECTORY) {
                await deleteRecursively(childFile.get_path(), true);
            } else {
              await childFile.delete_async(GLib.PRIORITY_DEFAULT, null);
            }

        }

        if(deleteRootFolder){
          await file.delete_async(GLib.PRIORITY_DEFAULT, null);
        }

        console.log('recursive delete completed');

    } catch (error) {
        console.log('Error deleting set directory: ' + error);
    }
  }

/**
* Convert a byteArray to a string
* @param {ByteArray} byteArray
* @return {String}
**/
export const byteArrayToString = (byteArray) => {
    let decoder = new TextDecoder('utf-8');
    return decoder.decode(byteArray);
}

/**
* Work out the dimensions of an SVG file
* @param {Gio.File} iconFile - the SVG icon file reference to use
* @param {Boolean} isGResource - whether the file is stored as a GResource (true) or is a regular file on the user's system (false)
* @return {[width<Number>, height<Number>]} - the width and height of the SVG
**/
export const getIconFileDimensions = (iconFile, isGResource = false) => {

  let width = 16;
  let height = 16;
  let pixbuf;

  const [, fileContents] = iconFile.load_contents(null);
  const stringContents = new TextDecoder().decode(fileContents);

  // If the icon file contains em or rem units, roughly estimate its size in pixels
  if(stringContents.match(/em|rem/i)){
    if(stringContents.match(/1em|1rem/i)){
      width, height = 16;
    } else if(stringContents.match(/2em|2rem/i)){
      width, height = 32;
    } else if(stringContents.match(/3em|3rem/i)){
      width, height = 48;
    } else if(stringContents.match(/4em|4rem/i)){
      width, height = 64;
    }
  } else {

    // Otherwise, create a Pixbuf to determine the exact width and height of the icon
    if(isGResource){
      // Removes the resource:// at the start of the path so that the URI is in Pixbuf's desired format
      pixbuf = GdkPixbuf.Pixbuf.new_from_resource(iconFile.get_uri().replace('resource://', ''));
    } else {
      pixbuf = GdkPixbuf.Pixbuf.new_from_file(iconFile.get_path());
    }

    width = pixbuf.width;
    height = pixbuf.height;

  }

  return [width, height];
}
