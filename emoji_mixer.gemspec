# frozen_string_literal: true

require "json"

Gem::Specification.new do |spec|
  spec.name = "emoji_mixer"
  # package.json holds the version of every package in this repository
  spec.version = JSON.parse(File.read(File.join(__dir__, "package.json")))["version"]
  spec.summary = "Get the URL of a Google Emoji Kitchen image for two emojis."
  spec.authors = ["MattFor"]
  spec.email = ["mattfor@relaxy.xyz"]
  spec.homepage = "https://github.com/MattFor/emoji-mixer"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.3"
  spec.files = ["bindings/ruby/lib/emoji_mixer.rb", "compatibility.json", "README.md", "LICENSE"]
  spec.require_paths = ["bindings/ruby/lib"]
  spec.metadata = {
    "source_code_uri" => "https://github.com/MattFor/emoji-mixer",
    "changelog_uri" => "https://github.com/MattFor/emoji-mixer/blob/master/CHANGELOG.md"
  }
end
