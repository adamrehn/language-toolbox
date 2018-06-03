# Language Toolbox API Documentation

## Table of contents

- [Server Service](#server-service)
    - [ListCapabilities RPC](#listcapabilities-rpc)
    - [GenerateAst RPC](#generateast-rpc)
    - [PerformAstMatch RPC](#performastmatch-rpc)
    - [PerformIOMatch RPC](#performiomatch-rpc)
    - [PerformUnitTests RPC](#performunittests-rpc)
- [LanguageModule Service](#languagemodule-service)
    - [GetCapabilities RPC](#getcapabilities-rpc)
    - [GetSandboxDetails RPC](#getsandboxdetails-rpc)
    - [GenerateAst RPC](#generateast-rpc-1)
    - [CodegenIOCapture RPC](#codegeniocapture-rpc)
    - [CodegenUnitTests RPC](#codegenunittests-rpc)


<br><br><br>

## Server Service

*Service defined in [server.proto](../server/proto/server.proto).*

This is the public interface exposed by the Language Toolbox server for use by client applications.

<br><br>

### ListCapabilities RPC

Lists the programming languages that the server supports, as well as which processing features are supported for each language.

#### RPC input data takes the form of the `Empty` message type, which has the structure:

*This message type contains no fields.*

#### RPC output data takes the form of the `ListCapabilitiesResponse` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>capabilities</td><td>Array of  <code>LanguageCapabilities</code></td><td>The list of programming languages and associated processing capabilities</td></tr></tbody></table>

The `LanguageCapabilities` message type has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>language</td><td> string</td><td>The name of the programming language</td></tr><tr><td>capabilities</td><td> uint32</td><td>A bitfield containing flags for each supported processing capability (see the <code>Capabilities</code> enum for supported flags)</td></tr></tbody></table>

The `Capabilities` enum type has the members:

<table><thead><tr><th>Member</th><th>Value</th><th>Description</th></tr></thead><tbody><tr><td>NONE</td><td>0</td><td>Sentinel value (unused)</td></tr><tr><td>GENERATE_ASTS</td><td>1</td><td>Supports generation of Abstract Syntax Trees</td></tr><tr><td>IO_MATCHING</td><td>2</td><td>Supports I/O matching</td></tr><tr><td>UNIT_TESTING</td><td>4</td><td>Supports unit testing</td></tr></tbody></table>

<br><br>

### GenerateAst RPC

Generates the Abstract Syntax Tree (in JSON format) for the supplied source code.

#### RPC input data takes the form of the `GenerateAstRequest` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>language</td><td> string</td><td>The name of the programming language in which the source code is written</td></tr><tr><td>source</td><td> string</td><td>The source code for which the Abstract Syntax Tree should be generated</td></tr></tbody></table>

#### RPC output data takes the form of the `GenerateAstResponse` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>error</td><td> string</td><td>Contains the error details if an error occurred, or an empty string upon success</td></tr><tr><td>ast</td><td> string</td><td>The generated Abstract Syntax Tree, in JSON format (the structure of the tree is language-specific)</td></tr></tbody></table>

<br><br>

### PerformAstMatch RPC

Generates the Abstract Syntax Tree (in JSON format) for the supplied source code and matches it against the supplied JSONPath patterns.

#### RPC input data takes the form of the `PerformAstMatchRequest` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>language</td><td> string</td><td>The name of the programming language in which the source code is written</td></tr><tr><td>source</td><td> string</td><td>The source code for which the Abstract Syntax Tree should be generated</td></tr><tr><td>patterns</td><td>Array of  string</td><td>The list of JSONPath expressions to match against the generated Abstract Syntax Tree</td></tr></tbody></table>

#### RPC output data takes the form of the `PerformAstMatchResponse` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>error</td><td> string</td><td>Contains the error details if an error occurred, or an empty string upon success</td></tr><tr><td>ast</td><td> string</td><td>The entire generated Abstract Syntax Tree, in JSON format, before applying any pattern matching</td></tr><tr><td>matches</td><td>Array of  string</td><td>The list of matches for each supplied pattern, in JSON format</td></tr></tbody></table>

<br><br>

### PerformIOMatch RPC

Runs the supplied source code with the specified input data and matches the output against the specified regular expression patterns.

#### RPC input data takes the form of the `PerformIOMatchRequest` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>language</td><td> string</td><td>The name of the programming language in which the source code is written</td></tr><tr><td>source</td><td> string</td><td>The source code upon which the code in the <code>invocation</code> parameter depends</td></tr><tr><td>invocation</td><td> string</td><td>The source code to be executed and whose output will be captured</td></tr><tr><td>stdin</td><td> string</td><td>The string (including any newlines) to be used as the stdin data</td></tr><tr><td>combine</td><td> bool</td><td>Whether the stdout and stderr streams should be combined</td></tr><tr><td>patternsStdOut</td><td>Array of  string</td><td>The list of regular expression patterns to match against the stdout data</td></tr><tr><td>patternsStdErr</td><td>Array of  string</td><td>The list of regular expression patterns to match against the stderr data</td></tr><tr><td>timeout</td><td> uint32</td><td>Execution time limit (leave blank to use default timeout)</td></tr></tbody></table>

#### RPC output data takes the form of the `PerformIOMatchResponse` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>error</td><td> string</td><td>Contains the error details if an error occurred, or an empty string upon success</td></tr><tr><td>stdout</td><td> bytes</td><td>The captured stdout data (interleaved with the captured stderr data if <code>combine</code> was true)</td></tr><tr><td>stderr</td><td> bytes</td><td>The captured stderr data (empty if <code>combine</code> was true)</td></tr><tr><td>matchesStdOut</td><td>Array of  string</td><td>The list of matches for the patterns that we applied to the stdout data</td></tr><tr><td>matchesStdErr</td><td>Array of  string</td><td>The list of matches for the patterns that we applied to the stderr data</td></tr></tbody></table>

<br><br>

### PerformUnitTests RPC

Runs the supplied unit tests against the supplied source code and returns the test results.

#### RPC input data takes the form of the `PerformUnitTestsRequest` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>language</td><td> string</td><td>The name of the programming language in which the source code is written</td></tr><tr><td>source</td><td> string</td><td>The source code that the unit tests are designed to validate</td></tr><tr><td>tests</td><td>Array of  <code>UnitTest</code></td><td>The list of unit tests to be run</td></tr><tr><td>timeout</td><td> uint32</td><td>Execution time limit (leave blank to use default timeout)</td></tr></tbody></table>

The `UnitTest` message type has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>invocation</td><td> string</td><td>The method which will be called once for each test case</td></tr><tr><td>setup</td><td> string</td><td>The setup code to be run before the unit test (if any)</td></tr><tr><td>teardown</td><td> string</td><td>The teardown code to be run after the unit test (if any)</td></tr><tr><td>cases</td><td>Array of  <code>TestCase</code></td><td>The list of test cases</td></tr></tbody></table>

The `TestCase` message type has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>inputs</td><td>Array of  string</td><td>The input parameters for the test case</td></tr><tr><td>setup</td><td> string</td><td>The setup code to be run before the test case (if any)</td></tr><tr><td>teardown</td><td> string</td><td>The teardown code to be run after the test case (if any)</td></tr><tr><td>expected</td><td> <code>TestCaseResult</code></td><td>The expected output of the test case</td></tr></tbody></table>

The `TestCaseResult` message type has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>output</td><td> string</td><td>A string representation of the return value or thrown exception</td></tr><tr><td>type</td><td> string</td><td>The type of the returned value or thrown exception</td></tr><tr><td>exception</td><td> bool</td><td>Whether an exception was thrown or not</td></tr></tbody></table>

#### RPC output data takes the form of the `PerformUnitTestsResponse` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>error</td><td> string</td><td>Contains the error details if an error occurred, or an empty string upon success</td></tr><tr><td>passed</td><td> uint32</td><td>The total number of test cases that passed</td></tr><tr><td>failed</td><td> uint32</td><td>The total number of test cases that failed</td></tr><tr><td>results</td><td>Array of  <code>UnitTestResultVector</code></td><td>The list of results for each unit test</td></tr></tbody></table>

The `UnitTestResultVector` message type has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>result</td><td>Array of  <code>TestCaseResult</code></td><td>The list of test case results</td></tr></tbody></table>

The `TestCaseResult` message type has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>output</td><td> string</td><td>A string representation of the return value or thrown exception</td></tr><tr><td>type</td><td> string</td><td>The type of the returned value or thrown exception</td></tr><tr><td>exception</td><td> bool</td><td>Whether an exception was thrown or not</td></tr></tbody></table>

<br><br><br>

## LanguageModule Service

*Service defined in [language.proto](../server/proto/language.proto).*

This is the private interface implemented by each individual language module for communication with the Language Toolbox server core.

**This service is only used internally and is not exposed to client applications. Client application developers should refer to the `Server` service.**

<br><br>

### GetCapabilities RPC

Specifies the programming language that this module is for, as well as which processing features are supported.

#### RPC input data takes the form of the `Empty` message type, which has the structure:

*This message type contains no fields.*

#### RPC output data takes the form of the `LanguageCapabilities` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>language</td><td> string</td><td>The name of the programming language</td></tr><tr><td>capabilities</td><td> uint32</td><td>A bitfield containing flags for each supported processing capability (see the <code>Capabilities</code> enum for supported flags)</td></tr></tbody></table>

The `Capabilities` enum type has the members:

<table><thead><tr><th>Member</th><th>Value</th><th>Description</th></tr></thead><tbody><tr><td>NONE</td><td>0</td><td>Sentinel value (unused)</td></tr><tr><td>GENERATE_ASTS</td><td>1</td><td>Supports generation of Abstract Syntax Trees</td></tr><tr><td>IO_MATCHING</td><td>2</td><td>Supports I/O matching</td></tr><tr><td>UNIT_TESTING</td><td>4</td><td>Supports unit testing</td></tr></tbody></table>

<br><br>

### GetSandboxDetails RPC

Specifies the details for running the Docker sandbox image for this module.

#### RPC input data takes the form of the `Empty` message type, which has the structure:

*This message type contains no fields.*

#### RPC output data takes the form of the `SandboxDetails` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>image</td><td> string</td><td>The name of the Docker image to be used for sandboxed execution</td></tr><tr><td>command</td><td>Array of  string</td><td>The command to be run inside each sandbox container instance, which accepts codegen output as its stdin data</td></tr></tbody></table>

<br><br>

### GenerateAst RPC

Generates the Abstract Syntax Tree for the supplied source code (if supported.)

#### RPC input data takes the form of the `GenerateAstRequest` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>language</td><td> string</td><td>The name of the programming language in which the source code is written</td></tr><tr><td>source</td><td> string</td><td>The source code for which the Abstract Syntax Tree should be generated</td></tr></tbody></table>

#### RPC output data takes the form of the `GenerateAstResponse` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>error</td><td> string</td><td>Contains the error details if an error occurred, or an empty string upon success</td></tr><tr><td>ast</td><td> string</td><td>The generated Abstract Syntax Tree, in JSON format (the structure of the tree is language-specific)</td></tr></tbody></table>

<br><br>

### CodegenIOCapture RPC

Performs codegen and returns the sandbox input data required to run the supplied source code with the specified input data (if supported.)

#### RPC input data takes the form of the `CodegenIOCaptureRequest` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>source</td><td> string</td><td>The source code upon which the code in the <code>invocation</code> parameter depends</td></tr><tr><td>invocation</td><td> string</td><td>The source code to be executed and whose output will be captured</td></tr><tr><td>stdin</td><td> string</td><td>The string (including any newlines) to be used as the stdin data</td></tr></tbody></table>

#### RPC output data takes the form of the `CodegenIOCaptureResponse` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>error</td><td> string</td><td>Contains the error details if an error occurred, or an empty string upon success</td></tr><tr><td>data</td><td> bytes</td><td>The codegen output, ready to be passed to an instance of the language module's Docker sandbox container for execution</td></tr></tbody></table>

<br><br>

### CodegenUnitTests RPC

Performs codegen and returns the sandbox input data required to run the specified unit tests on the supplied source code (if supported.)

#### RPC input data takes the form of the `CodegenUnitTestsRequest` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>source</td><td> string</td><td>The source code that the unit tests are designed to validate</td></tr><tr><td>tests</td><td>Array of  <code>UnitTest</code></td><td>The list of unit tests to be run</td></tr></tbody></table>

The `UnitTest` message type has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>invocation</td><td> string</td><td>The method which will be called once for each test case</td></tr><tr><td>setup</td><td> string</td><td>The setup code to be run before the unit test (if any)</td></tr><tr><td>teardown</td><td> string</td><td>The teardown code to be run after the unit test (if any)</td></tr><tr><td>cases</td><td>Array of  <code>TestCase</code></td><td>The list of test cases</td></tr></tbody></table>

The `TestCase` message type has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>inputs</td><td>Array of  string</td><td>The input parameters for the test case</td></tr><tr><td>setup</td><td> string</td><td>The setup code to be run before the test case (if any)</td></tr><tr><td>teardown</td><td> string</td><td>The teardown code to be run after the test case (if any)</td></tr><tr><td>expected</td><td> <code>TestCaseResult</code></td><td>The expected output of the test case</td></tr></tbody></table>

The `TestCaseResult` message type has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>output</td><td> string</td><td>A string representation of the return value or thrown exception</td></tr><tr><td>type</td><td> string</td><td>The type of the returned value or thrown exception</td></tr><tr><td>exception</td><td> bool</td><td>Whether an exception was thrown or not</td></tr></tbody></table>

#### RPC output data takes the form of the `CodegenUnitTestsResponse` message type, which has the structure:

<table><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody><tr><td>error</td><td> string</td><td>Contains the error details if an error occurred, or an empty string upon success</td></tr><tr><td>data</td><td> bytes</td><td>The codegen output, ready to be passed to an instance of the language module's Docker sandbox container for execution</td></tr></tbody></table>