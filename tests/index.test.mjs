import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const targets = [{
    name: "source", module: await import("../index.js"),
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
        default: getEmojiMixUrl, baseUrl, checkSupported, emojiCompatibilityData, getEmojiCombo, googleRequestUrl, googleRequestUrlEmojiPart, supportedEmojis, toUnicode,
    } = actualModule;

    test(`[${name}] exports are wired up`, () =>
    {
        assert.equal(typeof getEmojiMixUrl, "function");
        assert.equal(typeof toUnicode, "function");
        assert.equal(typeof getEmojiCombo, "function");
        assert.equal(typeof checkSupported, "function");
        assert.equal(typeof googleRequestUrl, "function");
        assert.equal(typeof googleRequestUrlEmojiPart, "function");

        assert.ok(Array.isArray(supportedEmojis));
        assert.ok(emojiCompatibilityData && typeof emojiCompatibilityData === "object");
    });

    test(`[${name}] toUnicode handles codepoints, emoji chars, and invalid input`, () =>
    {
        assert.equal(toUnicode("2615"), "2615");
        assert.equal(toUnicode("☕"), "2615");
        assert.equal(toUnicode("not-an-emoji"), undefined);
    });

    test(`[${name}] googleRequestUrlEmojiPart formats a codepoint for the URL`, () =>
    {
        assert.equal(googleRequestUrlEmojiPart("1f642-200d-2194-fe0f"), "u1f642-u200d-u2194-ufe0f");
    });

    test(`[${name}] checkSupported returns emoji data for supported emoji`, () =>
    {
        const coffee = checkSupported("☕");

        assert.ok(Array.isArray(coffee));
        assert.ok(coffee.length > 0);
    });

    test(`[${name}] getEmojiCombo returns the newest matching combo regardless of input order`, () =>
    {
        const forward = getEmojiCombo("2615", "2648");
        const reverse = getEmojiCombo("2648", "2615");

        assert.deepEqual(forward, reverse);
    });

    test(`[${name}] getEmojiCombo preserves caller order when preserveInputOrder is enabled`, () =>
    {
        const forward = getEmojiCombo("2615", "2648", true);
        const reverse = getEmojiCombo("2648", "2615", true);

        assert.deepEqual(forward, {
            leftEmoji: "2615", rightEmoji: "2648", date: "20260128",
        });

        assert.deepEqual(reverse, {
            leftEmoji: "2648", rightEmoji: "2615", date: "20260128",
        });
    });

    test(`[${name}] googleRequestUrl builds the expected gstatic URL`, () =>
    {
        const url = googleRequestUrl({
            leftEmoji: "2615", rightEmoji: "2648", date: "20260128",
        });

        assert.equal(url, `${baseUrl}/20260128/u2615/u2615_u2648.png`);
    });

    test(`[${name}] getEmojiMixUrl returns the expected URL for a valid pair`, () =>
    {
        assert.equal(getEmojiMixUrl("☕", "♈"), `${baseUrl}/20260128/u2615/u2615_u2648.png`);
    });

    test(`[${name}] getEmojiMixUrl returns the self-combo URL for coffee + coffee`, () =>
    {
        assert.equal(getEmojiMixUrl("☕", "☕"), `${baseUrl}/20201001/u2615/u2615_u2615.png`);
    });

    test(`[${name}] getEmojiMixUrl returns undefined for invalid input`, () =>
    {
        assert.equal(getEmojiMixUrl("not an emoji", "☕"), undefined);
    });

    test(`[${name}] checkSupported accepts Unicode codepoints directly`, () =>
    {
        const coffee = checkSupported("2615");

        assert.ok(Array.isArray(coffee));
        assert.ok(coffee.length > 0);
    });

    test(`[${name}] checkSupported returns null for unsupported emoji`, () =>
    {
        assert.equal(checkSupported("not-an-emoji"), null);
    });

    test(`[${name}] checkSupported returns expanded compatibility objects`, () =>
    {
        const coffee = checkSupported("2615");

        assert.ok(coffee.length > 0);

        const first = coffee[0];

        assert.equal(typeof first.leftEmoji, "string");
        assert.equal(typeof first.rightEmoji, "string");
        assert.equal(typeof first.date, "string");
    });

    test(`[${name}] getEmojiCombo finds self combinations`, () =>
    {
        assert.deepEqual(getEmojiCombo("2615", "2615"), {
            leftEmoji: "2615", rightEmoji: "2615", date: "20201001",
        });
    });

    test(`[${name}] getEmojiCombo returns undefined for unsupported combinations`, () =>
    {
        assert.equal(getEmojiCombo("2615", "deadbeef"), undefined);
    });

    test(`[${name}] getEmojiCombo returns undefined when either emoji is unsupported`, () =>
    {
        assert.equal(getEmojiCombo("deadbeef", "2615"), undefined);

        assert.equal(getEmojiCombo("2615", "deadbeef"), undefined);
    });

    test(`[${name}] googleRequestUrlEmojiPart handles simple emoji`, () =>
    {
        assert.equal(googleRequestUrlEmojiPart("2615"), "u2615");
    });

    test(`[${name}] toUnicode normalizes uppercase codepoints`, () =>
    {
        assert.equal(toUnicode("1F600"), "1f600");
    });

    test(`[${name}] toUnicode returns undefined for empty string`, () =>
    {
        assert.equal(toUnicode(""), undefined);
    });

    test(`[${name}] getEmojiMixUrl works with Unicode codepoints`, () =>
    {
        assert.equal(getEmojiMixUrl("2615", "2648"), `${baseUrl}/20260128/u2615/u2615_u2648.png`);
    });

    test(`[${name}] getEmojiMixUrl is symmetric`, () =>
    {
        assert.equal(getEmojiMixUrl("2615", "2648"), getEmojiMixUrl("2648", "2615"));
    });

    test(`[${name}] googleRequestUrl preserves multi-codepoint emoji`, () =>
    {
        const url = googleRequestUrl({
            leftEmoji: "1f642-200d-2194-fe0f", rightEmoji: "2615", date: "20260128",
        });

        assert.ok(url.includes("u1f642-u200d-u2194-ufe0f"));
    });

    test(`[${name}] every checkSupported entry references the queried emoji`, () =>
    {
        const coffee = checkSupported("2615");

        assert.ok(coffee.length > 0);

        for (const combo of coffee)
        {
            assert.equal(combo.leftEmoji, "2615");
        }
    });

    test(`[${name}] getEmojiCombo handles multi-codepoint emojis symmetrically`, () =>
    {
        const combo = getEmojiCombo("1f642-200d-2194-fe0f", "2615");

        if (combo)
        {
            assert.deepEqual(combo, getEmojiCombo("2615", "1f642-200d-2194-fe0f"));
        }
    });
}