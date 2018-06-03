#!/usr/bin/env bash
TOOLS="$HOME/.nuget/packages/grpc.tools/1.12.0/tools/linux_x64"
PROTOC="$TOOLS/protoc"
PLUGIN="$TOOLS/grpc_csharp_plugin"

"$PROTOC" -I../../proto --csharp_out ./source --csharp_opt=file_extension=.g.cs ../../proto/common.proto ../../proto/language.proto --grpc_out ./source --plugin=protoc-gen-grpc="$PLUGIN"
mv ./source/LanguageGrpc.cs ./source/LanguageGrpc.g.cs
