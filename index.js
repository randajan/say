import sapp, { argv } from "@randajan/simple-lib";


sapp(argv.isBuild, {
    mode:"node",
    lib:{
        entries:[
            "index.js",
            "defaults/locales/cs.js",
            "defaults/locales/sk.js",
            "defaults/locales/pl.js",
            "defaults/locales/en.js",
            "defaults/locales/de.js",
        ]
    }
})