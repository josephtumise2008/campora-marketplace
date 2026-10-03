const UNIVERSITIES = [
  {
    code: "ucla",
    name: "University of California, Los Angeles",
    shortName: "UCLA",
    city: "Los Angeles",
    state: "CA",
    domain: "ucla.edu",
    campuses: ["Westwood", "North Campus"],
    studentCount: 48000,
  },
  {
    code: "usc",
    name: "University of Southern California",
    shortName: "USC",
    city: "Los Angeles",
    state: "CA",
    domain: "usc.edu",
    campuses: ["University Park", "Health Sciences"],
    studentCount: 50000,
  },
  {
    code: "utexas",
    name: "University of Texas at Austin",
    shortName: "UT Austin",
    city: "Austin",
    state: "TX",
    domain: "utexas.edu",
    campuses: ["Main Campus", "West Campus"],
    studentCount: 52000,
  },
  {
    code: "umich",
    name: "University of Michigan",
    shortName: "Michigan",
    city: "Ann Arbor",
    state: "MI",
    domain: "umich.edu",
    campuses: ["Ann Arbor", "Dearborn"],
    studentCount: 48000,
  },
  {
    code: "nyu",
    name: "New York University",
    shortName: "NYU",
    city: "New York",
    state: "NY",
    domain: "nyu.edu",
    campuses: ["Washington Square", "Tandon"],
    studentCount: 59000,
  },
  {
    code: "ufl",
    name: "University of Florida",
    shortName: "Florida",
    city: "Gainesville",
    state: "FL",
    domain: "ufl.edu",
    campuses: ["Gainesville", "Jacksonville"],
    studentCount: 61000,
  },
  {
    code: "osu",
    name: "Ohio State University",
    shortName: "Ohio State",
    city: "Columbus",
    state: "OH",
    domain: "osu.edu",
    campuses: ["Main Campus", "West Campus"],
    studentCount: 66000,
  },
  {
    code: "uw",
    name: "University of Washington",
    shortName: "Washington",
    city: "Seattle",
    state: "WA",
    domain: "uw.edu",
    campuses: ["Seattle", "Tacoma"],
    studentCount: 47000,
  },
  {
    code: "other",
    name: "My community (non-campus)",
    shortName: "My community",
    city: "Local",
    state: "",
    domain: "",
    campuses: [],
    studentCount: 0,
  },
];

const UNIVERSITY_CITIES = {
  ucla: { city: "Los Angeles", state: "CA", zip: "90024" },
  usc: { city: "Los Angeles", state: "CA", zip: "90089" },
  utexas: { city: "Austin", state: "TX", zip: "78712" },
  umich: { city: "Ann Arbor", state: "MI", zip: "48104" },
  nyu: { city: "New York", state: "NY", zip: "10012" },
  ufl: { city: "Gainesville", state: "FL", zip: "32601" },
  osu: { city: "Columbus", state: "OH", zip: "43201" },
  uw: { city: "Seattle", state: "WA", zip: "98105" },
  other: { city: "Local", state: "", zip: "00000" },
};

const findUniversity = (code) =>
  UNIVERSITIES.find((u) => u.code === String(code || "").toLowerCase()) || null;

const universityCity = (code) =>
  UNIVERSITY_CITIES[String(code || "").toLowerCase()] || UNIVERSITY_CITIES.other;

module.exports = { UNIVERSITIES, UNIVERSITY_CITIES, findUniversity, universityCity };
