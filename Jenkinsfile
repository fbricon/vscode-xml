#!/usr/bin/env groovy

def installBuildRequirements(){
	def nodeHome = tool 'nodejs-7.7.4'
	env.PATH="${env.PATH}:${nodeHome}/bin"
	sh "npm install -g typescript"
	sh "npm install -g vsce"
}

def buildVscodeExtension(){
	sh "npm install"
	sh "npm run vscode:prepublish"
}

node('rhel7'){
	stage 'Build JDT LS'
	git url: 'https://github.com/angelozerr/lsp4xml.git'
	sh "./mvnw clean verify -B -U -fae -e"

	def files = findFiles(glob: '**/org.eclipse.lsp4xml/target/org.eclipse.lsp4xml-all.jar')
	stash name: 'server_distro', includes :files[0].path
}

node('rhel7'){
	stage 'Checkout vscode-xml code'
	deleteDir()
	git url: 'https://github.com/redhat-developer/vscode-xml.git'

	stage 'install vscode-xml build requirements'
	installBuildRequirements()

	stage 'Build vscode-xml'
	buildVscodeExtension()
	unstash 'server_distro'
	def files = findFiles(glob: '**/org.eclipse.lsp4xml/target/org.eclipse.lsp4xml-all.jar')
	sh "mkdir ./server"
	sh "tar -xvzf ${files[0].path} -C ./server"

	stage "Package vscode-xml"
	def packageJson = readJSON file: 'package.json'
	sh "vsce package -o java-${packageJson.version}-${env.BUILD_NUMBER}.vsix"

	stage 'Test vscode-xml for staging'
	wrap([$class: 'Xvnc']) {
		sh "npm test --silent"
	}
	
	stage 'Upload vscode-java to staging'
	def vsix = findFiles(glob: '**.vsix')
	sh "rsync -Pzrlt --rsh=ssh --protocol=28 ${vsix[0].path} ${UPLOAD_LOCATION}/jdt.ls/staging"
	stash name:'vsix', includes:files[0].path
}

node('rhel7'){
	if(publishToMarketPlace.equals('true')){
		timeout(time:5, unit:'DAYS') {
			input message:'Approve deployment?', submitter: 'fbricon'
		}

		stage "Publish to Marketplace"
		unstash 'vsix'
		withCredentials([[$class: 'StringBinding', credentialsId: 'vscode_java_marketplace', variable: 'TOKEN']]) {
			def vsix = findFiles(glob: '**.vsix')
			sh 'vsce publish -p ${TOKEN} --packagePath' + " ${vsix[0].path}"
		}
		archive includes:"**.vsix"

		stage "Publish to http://download.jboss.org/jbosstools/static/jdt.ls/stable/"
		// copy this stable build to Akamai-mirrored /static/ URL, so staging can be cleaned out more easily
		def vsix = findFiles(glob: '**.vsix')
		sh "rsync -Pzrlt --rsh=ssh --protocol=28 ${vsix[0].path} ${UPLOAD_LOCATION}/static/jdt.ls/stable/"
	}// if publishToMarketPlace
}