// MESH Patch Library V1
// Approved tier and conference patches.
// Import this object wherever a filter/header needs a patch.

import tierNfl from "./tier-nfl.png";
import tierFbs from "./tier-fbs.png";
import tierFcs from "./tier-fcs.png";

import nflAfc from "./nfl-afc.png";
import nflNfc from "./nfl-nfc.png";

import fbsAcc from "./fbs-acc.png";
import fbsBigTen from "./fbs-big-ten.png";
import fbsBig12 from "./fbs-big-12.png";
import fbsMac from "./fbs-mac.png";
import fbsMountainWest from "./fbs-mountain-west.png";
import fbsSec from "./fbs-sec.png";
import fbsSunBelt from "./fbs-sun-belt.png";

import fcsBigSky from "./fcs-big-sky.png";
import fcsCaa from "./fcs-caa.png";
import fcsIvy from "./fcs-ivy.png";
import fcsMvc from "./fcs-mvc.png";
import fcsNec from "./fcs-nec.png";
import fcsSlc from "./fcs-slc.png";

export const MESH_PATCHES = {
  tier: {
    NFL: tierNfl,
    FBS: tierFbs,
    FCS: tierFcs,
  },

  NFL: {
    AFC: nflAfc,
    NFC: nflNfc,
  },

  FBS: {
    ACC: fbsAcc,
    "Big Ten": fbsBigTen,
    "Big 12": fbsBig12,
    MAC: fbsMac,
    "Mountain West": fbsMountainWest,
    SEC: fbsSec,
    "Sun Belt": fbsSunBelt,
  },

  FCS: {
    "Big Sky": fcsBigSky,
    CAA: fcsCaa,
    Ivy: fcsIvy,
    MVC: fcsMvc,
    NEC: fcsNec,
    Southland: fcsSlc,
  },
};

export default MESH_PATCHES;
