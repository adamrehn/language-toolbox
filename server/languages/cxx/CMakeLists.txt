cmake_minimum_required(VERSION 3.8)
project(language-cxx)

# Set the C++ standard to C++11
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Enable all compiler warnings
if (MSVC)
	set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /W4 /MD")
else()
	set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall")
endif()

# Include our custom CMake modules
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_SOURCE_DIR}/cmake")

# Under Linux and macOS, link against pthreads and libdl
if (UNIX)
	set(LIBRARIES ${LIBRARIES} pthread dl)
endif()

# Include the headers for Boost
find_package(Boost 1.64 REQUIRED COMPONENTS filesystem)
set(LIBRARIES ${LIBRARIES} ${Boost_LIBRARIES})
include_directories(${Boost_INCLUDE_DIRS} SYSTEM)

# Link against JsonCpp
find_package(jsoncpp REQUIRED CONFIG)
set(LIBRARIES ${LIBRARIES} jsoncpp_lib)

# Link against protobuf and gRPC
find_package(Protobuf REQUIRED)
find_package(GRPC REQUIRED)
set(LIBRARIES ${LIBRARIES} protobuf::libprotobuf gRPC::grpc++_reflection)
include_directories(${Protobuf_INCLUDE_DIRS} SYSTEM)

# Link against zlib, since LLVM requires it
find_package(ZLIB REQUIRED)
set(LIBRARIES ${LIBRARIES} ${ZLIB_LIBRARIES})
include_directories(${ZLIB_INCLUDE_DIRS} SYSTEM)

# Link against LLVM & Clang
find_package(LLVM REQUIRED)
llvm_map_components_to_libnames(LLVM_LIBS
	Support
	Core
	AsmPrinter
	Option
)
set(LIBRARIES ${LIBRARIES}
	clangFrontendTool
	clangFrontend
	clangDriver
	clangSerialization
	clangTooling
	clangToolingCore
	clangParse
	clangSema
	clangEdit
	clangAnalysis
	clangLex
	clangAST
	clangBasic
	${LLVM_LIBS}
)
include_directories(${LLVM_INCLUDE_DIRS} SYSTEM)
link_directories(${LLVM_LIBRARY_DIRS})

# Generate our gRPC service definition code
set(PROTOS
	${CMAKE_SOURCE_DIR}/../../proto/common.proto
	${CMAKE_SOURCE_DIR}/../../proto/language.proto
)
set(GEN_DIR "${CMAKE_SOURCE_DIR}/gen")
protobuf_generate_cpp(PROTO_SOURCES PROTO_HEADERS ${GEN_DIR} ${PROTOS})
grpc_generate_cpp(GRPC_SOURCES GRPC_HEADERS ${GEN_DIR} ${PROTOS})

# Build the language module
add_executable(language-cxx
	source/main.cpp
	source/AstGenerator.cpp
	source/CodegenManager.cpp
	source/LanguageModuleImp.cpp
	source/IOCaptureCodegen.cpp
	source/TempDirectory.cpp
	source/UnitTestCodegen.cpp
	source/Utility.cpp
	${PROTO_SOURCES}
	${GRPC_SOURCES}
)
target_link_libraries(language-cxx ${LIBRARIES})

# Installation rules (by default we install to the top level of the build tree)
set(CMAKE_INSTALL_PREFIX "${CMAKE_BINARY_DIR}")
install(TARGETS language-cxx RUNTIME DESTINATION bin)
