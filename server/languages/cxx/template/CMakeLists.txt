cmake_minimum_required(VERSION 3.8)
project(CodegenOutput)

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

# Link against the static version of JsonCpp
find_package(jsoncpp REQUIRED CONFIG)
set(LIBRARIES ${LIBRARIES} jsoncpp_lib_static)

# Build the completed template code
add_executable(out template.cpp redirect.cpp)
target_link_libraries(out ${LIBRARIES})

# Installation rules (by default we install to the top level of the build tree)
set(CMAKE_INSTALL_PREFIX "${CMAKE_BINARY_DIR}")
install(TARGETS out RUNTIME DESTINATION bin)
