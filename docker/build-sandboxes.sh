#!/usr/bin/env bash
function buildSandboxImage {
	docker build --tag "adamrehn/language-toolbox-sandbox-$1:latest" "./sandboxes/sandbox-$1"
}

buildSandboxImage 'cxx'
buildSandboxImage 'csharp'
buildSandboxImage 'java'
buildSandboxImage 'javascript'
buildSandboxImage 'python'
