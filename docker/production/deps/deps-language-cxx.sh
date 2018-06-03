#!/usr/bin/env bash
set -e

apt-get install -y --no-install-recommends \
	autoconf \
	automake \
	build-essential \
	clang-6.0 \
	cmake \
	git \
	libboost-all-dev \
	libclang-6.0-dev \
	libedit-dev \
	libjsoncpp-dev \
	libtool \
	llvm-6.0 \
	llvm-6.0-dev \
	pkg-config \
	wget \
	zlib1g-dev

# Build gRPC from source to ensure we have an up-to-date version
cd /tmp && git clone --recursive -b v1.12.0 https://github.com/grpc/grpc
cd /tmp/grpc && make CFLAGS='-Wno-implicit-fallthrough' && make install
cd /tmp/grpc/third_party/protobuf && make install
rm -R /tmp/grpc
