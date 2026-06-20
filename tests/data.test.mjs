import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const targets = [{
    name: "source", module: await import("../data.js"),
}];

// Just to make sure nothing gets messed up within the conversion
for (const [name, path] of [["esm", "../dist/index.mjs"], ["cjs", "../dist/index.cjs"],])
{
    if (fs.existsSync(new URL(path, import.meta.url)))
    {
        console.log(`Found ${path}. Including ${name} tests.`);

        try
        {
            targets.push({
                name, module: await import(path),
            });
        }
        catch (err)
        {
            console.warn(`Failed to import ${path}. Skipping ${name} tests.`);
            console.warn(err);
        }
    }
    else
    {
        console.warn(`${path} not found. Skipping ${name} tests.`);
    }
}

for (const { name, module } of targets)
{
    const actualModule = module?.emojiCompatibilityData ? module : module?.default?.emojiCompatibilityData ? module.default : module;

    const {
        emojiCompatibilityData, supportedEmojis,
    } = actualModule;

    test(`[${name}] supported emoji list includes expected entries`, () =>
    {
        assert.ok(supportedEmojis.includes("1fa84"));
        assert.ok(supportedEmojis.includes("1f444"));
        assert.ok(supportedEmojis.includes("1f397-fe0f"));
    });

    test(`[${name}] compatibility data contains lookup tables`, () =>
    {
        assert.ok(Array.isArray(emojiCompatibilityData.$d));
        assert.ok(Array.isArray(emojiCompatibilityData.$e));

        assert.ok(emojiCompatibilityData.$d.length > 0);
        assert.ok(emojiCompatibilityData.$e.length > 0);
    });

    test(`[${name}] coffee emoji has compatibility entries`, () =>
    {
        assert.ok(Array.isArray(emojiCompatibilityData["2615"]));
        assert.ok(emojiCompatibilityData["2615"].length > 0);
    });

    test(`[${name}] coffee contains self-combination`, () =>
    {
        const dates = emojiCompatibilityData.$d;
        const emojis = emojiCompatibilityData.$e;

        const found = emojiCompatibilityData["2615"].some(([emojiIndex, dateIndex]) =>
        {
            const emoji = emojis[emojiIndex];
            const date = dates[dateIndex];

            return ((emoji === 0x2615 || emoji === "2615") && date === 20201001);
        });

        assert.ok(found);
    });

    test(`[${name}] coffee contains aries combination`, () =>
    {
        const dates = emojiCompatibilityData.$d;
        const emojis = emojiCompatibilityData.$e;

        const found = emojiCompatibilityData["2615"].some(([emojiIndex, dateIndex]) =>
        {
            const emoji = emojis[emojiIndex];
            const date = dates[dateIndex];

            return ((emoji === 0x2648 || emoji === "2648") && date === 20260128);
        });

        assert.ok(found);
    });

    test(`[${name}] all combo entries reference valid lookup indices`, () =>
    {
        const dates = emojiCompatibilityData.$d;
        const emojis = emojiCompatibilityData.$e;

        for (const [key, combos] of Object.entries(emojiCompatibilityData))
        {
            if (key.startsWith("$"))
            {
                continue;
            }

            assert.ok(Array.isArray(combos));

            for (const entry of combos)
            {
                assert.equal(entry.length, 2);

                const [emojiIndex, dateIndex] = entry;

                assert.ok(Number.isInteger(emojiIndex), `Invalid emoji index in ${key}`);
                assert.ok(Number.isInteger(dateIndex), `Invalid date index in ${key}`);
                assert.notEqual(emojis[emojiIndex], undefined, `Missing emoji table entry ${emojiIndex}`);
                assert.notEqual(dates[dateIndex], undefined, `Missing date table entry ${dateIndex}`);
            }
        }
    });
}