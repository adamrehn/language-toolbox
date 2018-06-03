#include "AstGenerator.h"
#include <clang/Tooling/Tooling.h>
#include <clang/AST/ParentMap.h>
#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/Expr.h>
#include <clang/AST/ExprCXX.h>
#include <clang/AST/Stmt.h>
#include <clang/AST/StmtCXX.h>
#include <json/json.h>
#include <functional>
#include <stdexcept>
#include <sstream>
#include <memory>
#include <map>
#include <set>

namespace
{
	class AstProcessor
	{
		public:
			typename std::set<clang::ast_type_traits::DynTypedNode> NodeList;
			
			AstProcessor(clang::ASTContext& c) : context(c) {}
			Json::Value processDecl(const clang::Decl* d);
			Json::Value processStmt(const clang::Stmt* s);
		
		private:
			void declSpecifics(const clang::Decl* n, Json::Value& json);
			void stmtSpecifics(const clang::Stmt* n, Json::Value& json);
			
			Json::Value processAttributeKind(const clang::attr::Kind& kind);
			Json::Value processOverloadedOp(const clang::OverloadedOperatorKind& op);
			Json::Value processAtomicOp(const clang::AtomicExpr::AtomicOp& op);
			Json::Value processBinaryOp(const clang::BinaryOperatorKind& op);
			Json::Value processUnaryOp(const clang::UnaryOperatorKind& op);
			Json::Value processSourceLocation(const clang::SourceLocation& loc);
			
			string idToString(void* nodeID);
			Json::Value returnSeenNode(void* nodeID);
			
			clang::ASTContext& context;
			std::set<void*> seenNodes;
	};
	
	#define _(NodeTy) if (auto* node = llvm::dyn_cast<const clang::NodeTy>(n))
	
	//Type-specific transformations for declarations
	void AstProcessor::declSpecifics(const clang::Decl* n, Json::Value& json)
	{
		_(DeclContext)
		{
			//Iterate over the child declarations
			json["children"] = Json::Value(Json::arrayValue);
			for (auto childDecl : node->decls())
			{
				//Only add those children that are from the main source file, not from included headers
				if (this->context.getSourceManager().isInMainFile(childDecl->getLocation()) == true) {
					json["children"].append(this->processDecl(childDecl));
				}
			}
		}
		
		_(EnumDecl)
		{
			//Iterate over the enum members
			json["enumerators"] = Json::Value(Json::arrayValue);
			for (auto enumerator : node->enumerators()) {
				json["children"].append(this->processDecl(enumerator));
			}
		}
		
		_(FunctionDecl)
		{
			json["parameters"] = Json::Value(Json::arrayValue);
			for (auto param : node->parameters()) {
				json["parameters"].append(this->processDecl(param));
			}
		}
		
		_(NamedDecl) {
			json["name"] = node->getNameAsString();
		}
		
		_(RecordDecl)
		{
			//Iterate over the structure fields
			json["fields"] = Json::Value(Json::arrayValue);
			for (auto field : node->fields()) {
				json["fields"].append(this->processDecl(field));
			}
		}
		
		_(ValueDecl) {
			json["type"] = node->getType().getAsString();
		}
	}
	
	//Type-specific transformations for statements
	void AstProcessor::stmtSpecifics(const clang::Stmt* n, Json::Value& json)
	{
		_(AtomicExpr) {
			json["operator"] = this->processAtomicOp(node->getOp());
		}
		
		_(BinaryOperator) {
			json["operator"] = this->processBinaryOp(node->getOpcode());
		}
		
		_(CallExpr)
		{
			json["callee"] = this->processStmt(node->getCallee());
			
			json["arguments"] = Json::Value(Json::arrayValue);
			for (auto arg : node->arguments()) {
				json["arguments"].append(this->processStmt(arg));
			}
		}
		
		_(CharacterLiteral) {
			json["value"] = node->getValue();
		}
		
		_(CXXBoolLiteralExpr) {
			json["value"] = node->getValue();
		}
		
		_(CXXCatchStmt) {
			json["exception"] = this->processDecl(node->getExceptionDecl());
		}
		
		_(CXXMemberCallExpr) {
			json["this"] = this->processStmt(node->getImplicitObjectArgument());
		}
		
		_(CXXOperatorCallExpr) {
			json["operator"] = this->processOverloadedOp(node->getOperator());
		}
		
		_(DeclRefExpr) {
			json["decl"] = this->processDecl(node->getDecl());
		}
		
		_(Expr) {
			json["type"] = node->getType().getAsString();
		}
		
		_(FloatingLiteral) {
			json["value"] = node->getValue().convertToDouble();
		}
		
		_(IntegerLiteral) {
			json["value"] = (unsigned long long)(node->getValue().getLimitedValue());
		}
		
		_(MemberExpr) {
			json["member"] = this->processDecl(node->getMemberDecl());
		}
		
		_(StringLiteral) {
			json["value"] = node->getString().str();
		}
		
		_(UnaryOperator) {
			json["operator"] = this->processUnaryOp(node->getOpcode());
		}
	}
	
	Json::Value AstProcessor::processAttributeKind(const clang::attr::Kind& kind)
	{
		switch (kind)
		{
			#define ATTR(X) case clang::attr::X: return string(#X);
			#define ATTR_RANGE(CLASS, FIRST_NAME, LAST_NAME)
			#include <clang/Basic/AttrList.inc>
			
			default:
				return string("<unknown attribute>");
		}
	}
	
	Json::Value AstProcessor::processOverloadedOp(const clang::OverloadedOperatorKind& op)
	{
		switch (op)
		{
			#define OVERLOADED_OPERATOR(Name,Spelling,Token,Unary,Binary,MemberOnly) case clang::OO_##Name: return string(#Name);
			#include <clang/Basic/OperatorKinds.def>
			
			default:
				return string("<unknown operator>");
		}
	}
	
	Json::Value AstProcessor::processAtomicOp(const clang::AtomicExpr::AtomicOp& op)
	{
		switch (op)
		{
			#define BUILTIN(ID, TYPE, ATTRS)
			#define ATOMIC_BUILTIN(ID, TYPE, ATTRS) case clang::AtomicExpr::AO##ID: return string(#ID);
			#include <clang/Basic/Builtins.def>
			
			default:
				return string("<unknown operator>");
		}
	}
	
	Json::Value AstProcessor::processBinaryOp(const clang::BinaryOperatorKind& op)
	{
		switch (op)
		{
			#define BINARY_OPERATION(Name, Spelling) case clang::BO_##Name: return string(#Name);
			#include <clang/AST/OperationKinds.def>
			
			default:
				return string("<unknown operator>");
		}
	}
	
	Json::Value AstProcessor::processUnaryOp(const clang::UnaryOperatorKind& op)
	{
		switch (op)
		{
			#define UNARY_OPERATION(Name, Spelling) case clang::UO_##Name: return string(#Name);
			#include <clang/AST/OperationKinds.def>
			
			default:
				return string("<unknown operator>");
		}
	}
	
	Json::Value AstProcessor::processSourceLocation(const clang::SourceLocation& loc)
	{
		//Verify that the location is valid
		if (loc.isInvalid()) { return Json::Value(Json::nullValue); }
		clang::PresumedLoc presumed = this->context.getSourceManager().getPresumedLoc(loc);
		if (presumed.isInvalid()) { return Json::Value(Json::nullValue); }
		
		//Extract the line and column values
		Json::Value location(Json::objectValue);
		location["line"] = presumed.getLine();
		location["col"] = presumed.getColumn();
		return location;
	}
	
	string AstProcessor::idToString(void* nodeID)
	{
		std::stringstream s;
		s << nodeID;
		return s.str();
	}
	
	Json::Value AstProcessor::returnSeenNode(void* nodeID)
	{
		Json::Value seen(Json::objectValue);
		seen["class"] = "<EXISTING NODE>";
		seen["id"] = this->idToString(nodeID);
		return seen;
	}
	
	Json::Value AstProcessor::processDecl(const clang::Decl* d)
	{
		//Propagate null values
		if (d == nullptr) {
			return Json::Value(Json::nullValue);
		}
		
		//If we have seen this node before, simply return its ID to prevent tree explosion or circular references
		void* nodeID = (void*)(d);
		if (this->seenNodes.count(nodeID) > 0) {
			return this->returnSeenNode(nodeID);
		}
		
		//Add the node ID to our list of seen nodes
		this->seenNodes.insert(nodeID);
		
		//Retrieve the class name for the node
		Json::Value json(Json::objectValue);
		json["class"] = string(d->getDeclKindName()) + "Decl";
		json["id"] = this->idToString(nodeID);
		
		//Retrieve the starting and ending source locations for the node
		json["locStart"] = this->processSourceLocation(d->getLocStart());
		json["locEnd"] = this->processSourceLocation(d->getLocEnd());
		
		//Perform any type-specific processing for this node
		this->declSpecifics(d, json);
		
		//Iterate over the declaration attributes
		json["attributes"] = Json::Value(Json::arrayValue);
		for (auto attr : d->attrs()) {
			json["attributes"].append(this->processAttributeKind(attr->getKind()));
		}
		
		//Process the body of the node, if it has one
		if (d->hasBody() == true) {
			json["body"] = this->processStmt(d->getBody());
		}
		
		return json;
	}
	
	Json::Value AstProcessor::processStmt(const clang::Stmt* s)
	{
		//Propagate null values
		if (s == nullptr) {
			return Json::Value(Json::nullValue);
		}
		
		//If we have seen this node before, simply return its ID to prevent tree explosion or circular references
		void* nodeID = (void*)(s);
		if (this->seenNodes.count(nodeID) > 0) {
			return this->returnSeenNode(nodeID);
		}
		
		//Add the node ID to our list of seen nodes
		this->seenNodes.insert(nodeID);
		
		//Retrieve the class name for the node
		Json::Value json(Json::objectValue);
		json["class"] = string(s->getStmtClassName());
		json["id"] = this->idToString(nodeID);
		
		//Retrieve the starting and ending source locations for the node
		json["locStart"] = this->processSourceLocation(s->getLocStart());
		json["locEnd"] = this->processSourceLocation(s->getLocEnd());
		
		//Perform any type-specific processing for this node
		this->stmtSpecifics(s, json);
		
		//Iterate over the children of the node
		json["children"] = Json::Value(Json::arrayValue);
		for (auto childStmt : s->children())
		{
			if (childStmt != nullptr) {
				json["children"].append(this->processStmt(childStmt));
			}
		}
		
		return json;
	}
}

string AstGenerator::generateAst(const string& code)
{
	//Attempt to generate the AST
	std::unique_ptr<clang::ASTUnit> ast = clang::tooling::buildASTFromCode(code);
	if (!ast) {
		throw std::runtime_error("failed to generate AST");
	}
	
	//Attempt to retrieve the root AST node for the translation unit
	clang::ASTContext& context = ast->getASTContext();
	clang::TranslationUnitDecl* translationUnit = context.getTranslationUnitDecl();
	if (translationUnit == nullptr) {
		throw std::runtime_error("failed to generate AST");
	}
	
	//Build the JSON representation of the AST
	AstProcessor processor(context);
	Json::Value astJson = processor.processDecl(translationUnit);
	
	//Format the JSON string
	Json::StreamWriterBuilder format;
	format["indentation"] = "";
	return Json::writeString(format, astJson);
}
