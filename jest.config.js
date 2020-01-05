module.exports = {
    preset: "@shelf/jest-mongodb",
    globals: {
        "ts-jest": {
            tsConfig: "tsconfig.json",
            diagnostics: {
                warnOnly: true
            }
        }
    },
    moduleFileExtensions: [
        "ts",
        "js"
    ],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    testMatch: [
        "**/test/**/*.test.(ts|js)"
    ],
    verbose: false
};
