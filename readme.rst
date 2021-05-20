Beacon
=====

Beacon is a lightweight-but-powerful programming editor packaged as a Chrome extension. Inspired by Sublime and built on top of the Ace editing
component, it offers:

-  multiple cursors
-  tabbed editing and retained files
-  syntax highlighting and themes
-  command palette/smart go to
-  hackable, synchronized configuration files
-  project files and folder view
-  fast project-wide string search
-  a serial terminal emulator

You can also load Beacon from source code. You'll need to have Node and NPM
installed first, then follow these steps:

0. Clone this repo to your local machine
1. Run ``npm install`` to get the development dependencies (Grunt, LESS,
   and some other packages)
2. Run ``npm run build``, which will generate the CSS files from the LESS
   source
3. Visit ``chrome://extensions`` and enable Developer Mode.
4. Still on the extensions page, click the button marked "Load unpacked
   extension..." and select the directory containing Beacon's
   manifest.json.

Beacon is a fork of `Caret <https://github.com/thomaswilburn/Caret>`_ by Thomas Wilburn, modified to include the serial terminal emulator `BeagleTerm <https://github.com/beagleterm/beagle-term>`_.

