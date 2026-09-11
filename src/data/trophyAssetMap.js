// MESH Football — Phase 9C-C production asset map
// Matches: public/assets/trophies/{nfl,fbs,fcs,plaques}

export const TROPHY_ASSET_MAP = {
  nfl_super_bowl: "/assets/trophies/nfl/MESH-Super-Bowl-Trophy.png",
  nfl_conference_afc: "/assets/trophies/nfl/MESH-AFC-Championship-Trophy-LOCKED.png",
  nfl_conference_nfc: "/assets/trophies/nfl/MESH-NFC-Championship-Trophy-LOCKED.png",

  fbs_national_championship: "/assets/trophies/fbs/MESH-FBS-National-Championship.png",
  "fbs_conference_acc": "/assets/trophies/fbs/MESH-ACC-Championship.png",
  "fbs_conference_big-ten": "/assets/trophies/fbs/MESH-Big-Ten-Championship.png",
  "fbs_conference_big-12": "/assets/trophies/fbs/MESH-Big-12-Championship.png",
  "fbs_conference_mac": "/assets/trophies/fbs/MESH-MAC-Championship.png",
  "fbs_conference_mountain-west": "/assets/trophies/fbs/MESH-Mountain-West-Championship.png",
  "fbs_conference_sec": "/assets/trophies/fbs/MESH-SEC-Championship.png",
  "fbs_conference_sun-belt": "/assets/trophies/fbs/MESH-Sun-Belt-Championship.png",

  fcs_national_championship: "/assets/trophies/fcs/MESH-FCS-National-Championship.png",
  "fcs_conference_big-sky": "/assets/trophies/fcs/MESH-Big-Sky-Championship.png",
  "fcs_conference_caa": "/assets/trophies/fcs/MESH-CAA-Championship.png",
  "fcs_conference_ivy-league": "/assets/trophies/fcs/MESH-Ivy-League-Championship.png",
  "fcs_conference_mvc": "/assets/trophies/fcs/MESH-MVC-Championship.png",
  "fcs_conference_nec": "/assets/trophies/fcs/MESH-NEC-Championship.png",
  "fcs_conference_southland": "/assets/trophies/fcs/MESH-Southland-Championship.png",

  "fbs_bowl_arizona-bowl": "/assets/trophies/fbs/MESH-Arizona-Bowl.png",
  "fbs_bowl_armed-forces-bowl": "/assets/trophies/fbs/MESH-Armed-Forces-Bowl.png",
  "fbs_bowl_bahamas-bowl": "/assets/trophies/fbs/MESH-Bahamas-Bowl.png",
  "fbs_bowl_boca-raton-bowl": "/assets/trophies/fbs/MESH-Boca-Raton-Bowl.png",
  "fbs_bowl_cheez-it-citrus-bowl": "/assets/trophies/fbs/MESH-Cheez-It-Citrus-Bowl.png",
  "fbs_bowl_cotton-bowl": "/assets/trophies/fbs/MESH-Cotton-Bowl.png",
  "fbs_bowl_dukes-mayo-bowl": "/assets/trophies/fbs/MESH-Dukes-Mayo-Bowl.png",
  "fbs_bowl_famous-idaho-potato-bowl": "/assets/trophies/fbs/MESH-Famous-Idaho-Potato-Bowl.png",
  "fbs_bowl_fenway-bowl": "/assets/trophies/fbs/MESH-Fenway-Bowl.png",
  "fbs_bowl_fiesta-bowl": "/assets/trophies/fbs/MESH-Fiesta-Bowl-FINAL.png",
  "fbs_bowl_frisco-bowl": "/assets/trophies/fbs/MESH-Frisco-Bowl.png",
  "fbs_bowl_gator-bowl": "/assets/trophies/fbs/MESH-Gator-Bowl.png",
  "fbs_bowl_hawaii-bowl": "/assets/trophies/fbs/MESH-Hawaii-Bowl.png",
  "fbs_bowl_holiday-bowl": "/assets/trophies/fbs/MESH-Holiday-Bowl.png",
  "fbs_bowl_independence-bowl": "/assets/trophies/fbs/MESH-Independence-Bowl.png",
  "fbs_bowl_las-vegas-bowl": "/assets/trophies/fbs/MESH-Las-Vegas-Bowl.png",
  "fbs_bowl_liberty-bowl": "/assets/trophies/fbs/MESH-Liberty-Bowl.png",
  "fbs_bowl_music-city-bowl": "/assets/trophies/fbs/MESH-Music-City-Bowl.png",
  "fbs_bowl_myrtle-beach-bowl": "/assets/trophies/fbs/MESH-Myrtle-Beach-Bowl.png",
  "fbs_bowl_new-mexico-bowl": "/assets/trophies/fbs/MESH-New-Mexico-Bowl.png",
  "fbs_bowl_new-orleans-bowl": "/assets/trophies/fbs/MESH-New-Orleans-Bowl.png",
  "fbs_bowl_orange-bowl": "/assets/trophies/fbs/MESH-Orange-Bowl-FINAL.png",
  "fbs_bowl_peach-bowl": "/assets/trophies/fbs/MESH-Peach-Bowl.png",
  "fbs_bowl_pinstripe-bowl": "/assets/trophies/fbs/MESH-Pinstripe-Bowl.png",
  "fbs_bowl_pop-tarts-bowl": "/assets/trophies/fbs/MESH-Pop-Tarts-Bowl.png",
  "fbs_bowl_rose-bowl": "/assets/trophies/fbs/MESH-Rose-Bowl.png",
  "fbs_bowl_sugar-bowl": "/assets/trophies/fbs/MESH-Sugar-Bowl.png",
  "fbs_bowl_texas-bowl": "/assets/trophies/fbs/MESH-Texas-Bowl.png",
  "fbs_bowl_tony-the-tiger-sun-bowl": "/assets/trophies/fbs/MESH-Tony-the-Tiger-Sun-Bowl.png",
  "fbs_bowl_valero-alamo-bowl": "/assets/trophies/fbs/MESH-Valero-Alamo-Bowl.png",
};

export const WEEKLY_HIGH_SCORE_ASSETS = {
  franchise: "/assets/trophies/plaques/MESH-Franchise-Weekly-High-Score-Plaque.png",
  coach: "/assets/trophies/plaques/MESH-Coach-Weekly-High-Score-Plaque.png",
};

export function getTrophyAsset(assetKey) {
  return TROPHY_ASSET_MAP[assetKey] || null;
}
