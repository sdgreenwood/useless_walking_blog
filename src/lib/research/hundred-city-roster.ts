export type LeagueCity = { populationRank: number; name: string; state: string; population2025: number };

/** Frozen Census Vintage 2025 incorporated-place roster. Population selects membership only. */
export const HUNDRED_CITY_ROSTER: LeagueCity[] = [
  ["New York", "New York", 8584629], ["Los Angeles", "California", 3869089], ["Chicago", "Illinois", 2731585],
  ["Houston", "Texas", 2397315], ["Phoenix", "Arizona", 1665481], ["Philadelphia", "Pennsylvania", 1574281],
  ["San Antonio", "Texas", 1548422], ["San Diego", "California", 1406106], ["Dallas", "Texas", 1329491],
  ["Fort Worth", "Texas", 1028117], ["Jacksonville", "Florida", 1017689], ["Austin", "Texas", 1002632],
  ["San Jose", "California", 989814], ["Charlotte", "North Carolina", 964784], ["Columbus", "Ohio", 938396],
  ["Indianapolis", "Indiana", 901116], ["San Francisco", "California", 826079], ["Seattle", "Washington", 784777],
  ["Denver", "Colorado", 740613], ["Nashville", "Tennessee", 721074], ["Oklahoma City", "Oklahoma", 719849],
  ["Washington", "District of Columbia", 693645], ["El Paso", "Texas", 683012], ["Las Vegas", "Nevada", 679817],
  ["Boston", "Massachusetts", 672973], ["Detroit", "Michigan", 649095], ["Louisville", "Kentucky", 641962],
  ["Portland", "Oregon", 635109], ["Memphis", "Tennessee", 609647], ["Baltimore", "Maryland", 569997],
  ["Milwaukee", "Wisconsin", 562407], ["Albuquerque", "New Mexico", 556588], ["Fresno", "California", 555549],
  ["Tucson", "Arizona", 548371], ["Sacramento", "California", 536449], ["Atlanta", "Georgia", 529110],
  ["Kansas City", "Missouri", 521220], ["Mesa", "Arizona", 513656], ["Raleigh", "North Carolina", 506306],
  ["Colorado Springs", "Colorado", 494743], ["Miami", "Florida", 489812], ["Omaha", "Nebraska", 488797],
  ["Virginia Beach", "Virginia", 453737], ["Long Beach", "California", 450469], ["Oakland", "California", 440838],
  ["Minneapolis", "Minnesota", 430324], ["Bakersfield", "California", 422165], ["Tulsa", "Oklahoma", 416209],
  ["Tampa", "Florida", 413554], ["Aurora", "Colorado", 410053], ["Arlington", "Texas", 402134],
  ["Wichita", "Kansas", 400987], ["Cleveland", "Ohio", 363608], ["New Orleans", "Louisiana", 362154],
  ["Henderson", "Nevada", 353289], ["Urban Honolulu", "Hawaii", 341868], ["Anaheim", "California", 341008],
  ["Orlando", "Florida", 333888], ["Lexington", "Kentucky", 329751], ["Stockton", "California", 324597],
  ["Newark", "New Jersey", 323808], ["Riverside", "California", 323057], ["Irvine", "California", 318764],
  ["Corpus Christi", "Texas", 317247], ["Santa Ana", "California", 315586], ["Cincinnati", "Ohio", 314367],
  ["Greensboro", "North Carolina", 308667], ["Pittsburgh", "Pennsylvania", 307632], ["St. Paul", "Minnesota", 306684],
  ["Durham", "North Carolina", 305561], ["Jersey City", "New Jersey", 302013], ["Lincoln", "Nebraska", 301522],
  ["North Las Vegas", "Nevada", 296653], ["Plano", "Texas", 293028], ["Gilbert", "Arizona", 287285],
  ["Anchorage", "Alaska", 287155], ["Madison", "Wisconsin", 286233], ["Reno", "Nevada", 283621],
  ["Chandler", "Arizona", 278748], ["St. Louis", "Missouri", 278144], ["Chula Vista", "California", 275533],
  ["Fort Wayne", "Indiana", 275203], ["Buffalo", "New York", 274613], ["Lubbock", "Texas", 273071],
  ["Laredo", "Texas", 269515], ["Port St. Lucie", "Florida", 268062], ["St. Petersburg", "Florida", 264033],
  ["Toledo", "Ohio", 263423], ["Glendale", "Arizona", 260572], ["Winston-Salem", "North Carolina", 257271],
  ["Irving", "Texas", 257076], ["Chesapeake", "Virginia", 255332], ["Garland", "Texas", 249625],
  ["Scottsdale", "Arizona", 243006], ["Boise", "Idaho", 238429], ["Richmond", "Virginia", 237257],
  ["Frisco", "Texas", 236955], ["Cape Coral", "Florida", 236264], ["McKinney", "Texas", 236001],
  ["Huntsville", "Alabama", 233627]
].map(([name, state, population2025], index) => ({
  populationRank: index + 1,
  name: name as string,
  state: state as string,
  population2025: population2025 as number
}));
