cmake_minimum_required(VERSION 3.16)
project(api_cpp CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# libpq statt eines C++-Wrappers: eine Abhaengigkeit weniger, und der
# Dienst tut genau eine Abfrage.
find_package(PostgreSQL REQUIRED)

add_executable(api_cpp src/main.cpp src/config.cpp)
target_include_directories(api_cpp PRIVATE src ${PostgreSQL_INCLUDE_DIRS})
target_link_libraries(api_cpp PRIVATE ${PostgreSQL_LIBRARIES})

install(TARGETS api_cpp RUNTIME DESTINATION bin)
